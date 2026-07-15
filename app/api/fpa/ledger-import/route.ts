import { NextResponse } from "next/server";
import { requireApiMinLevel } from "@/lib/auth/api-guard";
import { getEffectiveSession } from "@/lib/auth/guard";
import { logUsageEvent } from "@/lib/audit/log-event";
import {
  LEDGER_SOURCES,
  commitLedgerImport,
  listLedgerSources,
  previewLedgerImport,
  type LedgerSourceKind,
} from "@/lib/finance/ledger-import-access";

const MAX_BYTES = 20 * 1024 * 1024;

export async function GET() {
  return NextResponse.json({ sources: listLedgerSources() });
}

export async function POST(req: Request) {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;
  try {
    const form = await req.formData();
    const file = form.get("file");
    const kind = String(form.get("kind") ?? "") as LedgerSourceKind;
    const stage = String(form.get("stage") ?? "preview");
    const period = String(form.get("period") ?? "").trim();
    const preferredSheet = String(form.get("sheet") ?? "").trim() || undefined;

    if (!LEDGER_SOURCES[kind]) {
      return NextResponse.json({ error: `未知来源类型：${kind}` }, { status: 400 });
    }
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "请上传 Excel 文件 (.xlsx)" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "文件超过 20MB" }, { status: 413 });
    }
    if (LEDGER_SOURCES[kind].needsPeriod && !/^\d{4}-\d{2}$/.test(period)) {
      return NextResponse.json({ error: "该来源需指定期间（格式 YYYY-MM）" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    if (stage === "commit") {
      const session = await getEffectiveSession();
      const importedBy = session?.email ?? session?.name ?? "web-import";
      const result = await commitLedgerImport(kind, buffer, file.name, period, importedBy, preferredSheet);
      await logUsageEvent({
        action: "import_commit",
        resource: `ledger:${kind}:${result.status}:${result.rowCount}`,
      });
      const status = result.status === "failed" ? 400 : 200;
      return NextResponse.json(result, { status });
    }

    const preview = await previewLedgerImport(kind, buffer, period, preferredSheet);
    return NextResponse.json(preview);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "导入失败" },
      { status: 400 },
    );
  }
}
