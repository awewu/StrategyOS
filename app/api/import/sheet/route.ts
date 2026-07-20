import { NextResponse } from "next/server";
import { requireApiMinLevel } from "@/lib/auth/api-guard";
import {
  listSheetProfiles,
  readSheetRows,
  saveSheetProfile,
} from "@/lib/compiler/sheet-import-access";
import {
  SHEET_SPECS,
  applyProfile,
  guessColumnMap,
  type ColumnMap,
} from "@/lib/compiler/sheet-profiles";
import { buildSheetDiff, SHEET_COMMIT_KEYS } from "@/lib/compiler/sheet-diff";
import {
  commitSheetRecords,
  loadExistingRecords,
} from "@/lib/compiler/sheet-commit-access";
import { dbAvailable } from "@/lib/db";
import { logUsageEvent } from "@/lib/audit/log-event";

export const runtime = "nodejs";

const MAX_BYTES = 100 * 1024 * 1024;
const PREVIEW_ROWS = 50;

/** GET ?sheetType= — 规格清单 + 已存画像 */
export async function GET(req: Request) {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;
  const sheetType = new URL(req.url).searchParams.get("sheetType") ?? undefined;
  const profiles = await listSheetProfiles(sheetType);
  const specs = Object.values(SHEET_SPECS).map((s) => ({
    sheetType: s.sheetType,
    label: s.label,
    fields: s.fields.map((f) => ({
      key: f.key,
      label: f.label,
      type: f.type,
      required: f.required ?? false,
    })),
  }));
  return NextResponse.json({ specs, profiles });
}

/** POST multipart — 上传+预检:map 优先级 用户调整 > 已存画像 > 表头猜测 */
export async function POST(req: Request) {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;
  try {
    const form = await req.formData();
    const file = form.get("file");
    const sheetType = String(form.get("sheetType") ?? "");
    const stage = String(form.get("stage") ?? "precheck");
    const spec = SHEET_SPECS[sheetType];
    if (!spec) {
      return NextResponse.json({ error: `未知 sheetType:${sheetType}` }, { status: 400 });
    }
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "请上传 Excel 文件 (.xlsx)" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "文件超过 100MB" }, { status: 413 });
    }

    const { headers, rows } = await readSheetRows(Buffer.from(await file.arrayBuffer()));
    if (headers.length === 0) {
      return NextResponse.json({ error: "未能读到表头 — 首行需为列名" }, { status: 400 });
    }

    let columnMap: ColumnMap | null = null;
    let mapSource: "user" | "profile" | "guess" = "guess";

    const userMapRaw = form.get("columnMap");
    if (typeof userMapRaw === "string" && userMapRaw.trim()) {
      columnMap = JSON.parse(userMapRaw) as ColumnMap;
      mapSource = "user";
    } else {
      const profiles = await listSheetProfiles(sheetType);
      const matched = profiles.find((p) =>
        Object.values(p.columnMap).every((h) => headers.includes(h)),
      );
      if (matched) {
        columnMap = matched.columnMap;
        mapSource = "profile";
      }
    }
    if (!columnMap) {
      columnMap = guessColumnMap(headers, spec);
      mapSource = "guess";
    }

    const { records, issues, errorRows } = applyProfile(rows, spec, columnMap);

    if (stage === "commit") {
      if (errorRows > 0) {
        return NextResponse.json(
          { error: `存在 ${errorRows} 行 error，修正后才能入库` },
          { status: 422 },
        );
      }
      if (records.length === 0) {
        return NextResponse.json({ error: "无可入库行" }, { status: 422 });
      }
      const commit = await commitSheetRecords(sheetType, records);
      await logUsageEvent({
        action: "import_commit",
        resource: `/api/import/sheet?sheetType=${sheetType}`,
        metadata: {
          created: commit.created,
          updated: commit.updated,
          skipped: commit.skipped,
          assertionTriggered: commit.assertionTriggered,
        },
        request: req,
      });
      return NextResponse.json({ ok: true, stage: "commit", ...commit });
    }

    let diff: ReturnType<typeof buildSheetDiff> | null = null;
    if ((await dbAvailable()) && SHEET_COMMIT_KEYS[sheetType]) {
      const existing = await loadExistingRecords(sheetType);
      const full = buildSheetDiff(records, existing, SHEET_COMMIT_KEYS[sheetType]);
      diff = { ...full, rows: full.rows.slice(0, PREVIEW_ROWS) };
    }

    return NextResponse.json({
      ok: true,
      sheetType,
      headers,
      columnMap,
      mapSource,
      totalRows: rows.length,
      validRows: records.length,
      errorRows,
      issues: issues.slice(0, 100),
      preview: records.slice(0, PREVIEW_ROWS),
      diff,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "解析失败" }, { status: 500 });
  }
}

/** PUT — 确认后保存画像(下月直接复用) */
export async function PUT(req: Request) {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;
  try {
    const b = await req.json();
    const sheetType = String(b.sheetType ?? "");
    const name = String(b.name ?? "").trim();
    if (!SHEET_SPECS[sheetType]) {
      return NextResponse.json({ error: `未知 sheetType:${sheetType}` }, { status: 400 });
    }
    if (!name) return NextResponse.json({ error: "画像名称必填" }, { status: 400 });
    if (!b.columnMap || typeof b.columnMap !== "object") {
      return NextResponse.json({ error: "columnMap 必填" }, { status: 400 });
    }
    const profile = await saveSheetProfile(sheetType, name, b.columnMap as ColumnMap);
    return NextResponse.json({ ok: true, profile });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "保存失败" }, { status: 500 });
  }
}
