import { NextResponse } from "next/server";
import { requireApiMinLevel } from "@/lib/auth/api-guard";
import { dbAvailable, prisma } from "@/lib/db";
import { saveDecodeBsc } from "@/lib/decode/data-access";
import { saveFpaEditable } from "@/lib/fpa/data-access";
import {
  compileStrategicText,
  extractTextFromPdf,
  extractTextFromXlsx,
  type CompiledObjective,
} from "@/lib/compiler/strategic-compiler";
import { sanitizeCompiledPayload } from "@/lib/compiler/import-quality";
import {
  loadExistingObjectiveTitles,
  mergeIntoStrategicPlan,
  replaceStrategicPlan,
} from "@/lib/compiler/merge-import";
import { planObjectivesToBscRows } from "@/lib/data/strategic-plan-data";
import { CURRENT_PERIOD } from "@/lib/stratos-demo-data";

export const runtime = "nodejs";

const ORG_UNIT_ID = "org-group-rhautt";
const HORIZON_START = 2026;
const HORIZON_END = 2028;

type ImportMode = "merge" | "replace";

async function ensurePlanId(): Promise<string> {
  const existing = await prisma.strategicPlan.findFirst({
    where: { orgUnitId: ORG_UNIT_ID, horizonStart: HORIZON_START, horizonEnd: HORIZON_END },
    select: { id: true },
  });
  if (existing) return existing.id;

  const plan = await prisma.strategicPlan.create({
    data: {
      orgUnitId: ORG_UNIT_ID,
      horizonStart: HORIZON_START,
      horizonEnd: HORIZON_END,
      status: "DRAFT",
    },
  });
  return plan.id;
}

export async function POST(req: Request) {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;

  if (!(await dbAvailable())) {
    return NextResponse.json({ error: "DATABASE_URL unset — 无法导入" }, { status: 503 });
  }

  try {
    const contentType = req.headers.get("content-type") ?? "";
    let rawText = "";
    let fileName = "paste.txt";
    let previewOnly = false;
    let mode: ImportMode = "merge";

    if (contentType.includes("application/json")) {
      const body = (await req.json()) as {
        rawText?: string;
        preview?: boolean;
        mode?: ImportMode;
      };
      rawText = body.rawText?.trim() ?? "";
      previewOnly = !!body.preview;
      if (body.mode === "replace") mode = "replace";
    } else {
      const form = await req.formData();
      const pasted = String(form.get("rawText") ?? "").trim();
      previewOnly = String(form.get("preview") ?? "") === "1";
      const modeField = String(form.get("mode") ?? "merge");
      if (modeField === "replace") mode = "replace";
      const file = form.get("file");
      if (pasted) rawText = pasted;
      if (file instanceof File && file.size > 0) {
        fileName = file.name;
        const buffer = Buffer.from(await file.arrayBuffer());
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
        if (ext === "pdf") {
          rawText = rawText || (await extractTextFromPdf(buffer));
        } else if (ext === "xlsx" || ext === "xls") {
          rawText = rawText || (await extractTextFromXlsx(buffer));
        } else {
          rawText = rawText || buffer.toString("utf8");
        }
      }
    }

    if (!rawText.trim()) {
      return NextResponse.json({ error: "无法提取文本 — 请上传 PDF/Excel 或粘贴正文" }, { status: 400 });
    }

    const compiled = compileStrategicText(rawText);
    const planId = await ensurePlanId();
    const existingTitles = mode === "merge" ? await loadExistingObjectiveTitles(planId) : [];
    const sanitized = sanitizeCompiledPayload(compiled, existingTitles);

    if (previewOnly) {
      return NextResponse.json({
        ok: true,
        fileName,
        mode,
        charCount: rawText.length,
        compiled: sanitized.payload,
        quality: sanitized.stats,
        rejected: sanitized.rejected.slice(0, 40),
        summary: [
          ...compiled.summary,
          `质量: 原始 ${sanitized.stats.rawObjectives} 目标 → 接受 ${sanitized.stats.acceptedObjectives} · 剔除 ${sanitized.stats.rejectedCount}`,
          mode === "merge" ? `合并模式: 与现有 ${existingTitles.length} 条指纹比对` : "替换模式: 将覆盖现有计划目标",
        ],
      });
    }

    const imported: string[] = [];

    if (mode === "merge") {
      const report = await mergeIntoStrategicPlan(planId, sanitized, { fileName });
      imported.push(
        `合并导入 +${report.addedObjectives} 目标 · 补 KR ${report.mergedKeyResults} · 跳过重复 ${report.skippedDuplicates}`,
      );
      imported.push(`计划合计 ${report.planObjectiveTotal} 目标`);
      if (report.intentUpdated) imported.push("意图已补全");
      if (report.northStarUpdated) imported.push("北极星已补全");
    } else {
      await replaceStrategicPlan(planId, sanitized.payload);
      imported.push(`替换导入 ${sanitized.stats.acceptedObjectives} 目标（剔除 ${sanitized.stats.rejectedCount} 条噪声/重复）`);
    }

    const hasStructuredObjectives = sanitized.stats.acceptedObjectives > 0;

    if (hasStructuredObjectives) {
      const derivedRows = planObjectivesToBscRows(
        sanitized.payload.objectives.map((o: CompiledObjective) => ({
          dimension: o.dimension,
          objective: o.objective ?? "",
          keyResults: o.keyResults.map((kr) => ({
            keyResult: kr.keyResult,
            target: kr.target ?? null,
          })),
          mustNotFail: null,
          mustWinStatus: null,
          notFailStatus: null,
        })),
      );
      await saveDecodeBsc(derivedRows, CURRENT_PERIOD, { syncToPlan: false });
    } else if (mode === "replace" && compiled.bscRows.length > 0) {
      await saveDecodeBsc(compiled.bscRows, CURRENT_PERIOD);
    }

    if (compiled.fpa) {
      const existing = await prisma.fpaPeriod.findFirst({
        where: { period: CURRENT_PERIOD, scope: "company" },
      });
      await saveFpaEditable(
        {
          revenueBudget: compiled.fpa.revenueBudget ?? Number(existing?.revenueBudget ?? 0),
          revenueActual: Number(existing?.revenueActual ?? 0),
          revenueForecast: compiled.fpa.revenueForecast ?? Number(existing?.revenueForecast ?? 0),
          profitBudget: compiled.fpa.profitBudget ?? Number(existing?.profitBudget ?? 0),
          profitActual: Number(existing?.profitActual ?? 0),
          profitForecast: compiled.fpa.profitForecast ?? Number(existing?.profitForecast ?? 0),
          cashRunwayMonths: 3,
        },
        CURRENT_PERIOD,
      );
      imported.push("FPA 数字已更新");
    }

    return NextResponse.json({
      ok: true,
      fileName,
      mode,
      charCount: rawText.length,
      compiled: sanitized.payload,
      quality: sanitized.stats,
      rejected: sanitized.rejected.slice(0, 40),
      imported,
      summary: compiled.summary,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "导入失败" }, { status: 500 });
  }
}
