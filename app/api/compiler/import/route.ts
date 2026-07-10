import { NextResponse } from "next/server";
import { requireApiAdmin, requireApiMinLevel } from "@/lib/auth/api-guard";
import { getSession } from "@/lib/auth/session";
import { dbAvailable, prisma } from "@/lib/db";
import { checkRateLimit, clientRateLimitKey } from "@/lib/rate-limit";
import { saveDecodeBsc } from "@/lib/decode/data-access";
import { saveFpaEditable } from "@/lib/fpa/data-access";
import {
  extractTextFromDocument,
  type CompiledObjective,
} from "@/lib/compiler/strategic-compiler";
import { sanitizeCompiledPayload } from "@/lib/compiler/import-quality";
import { buildImportDeductionReport } from "@/lib/compiler/import-deduction";
import { compileStrategicTextSmart, refineWithSemanticDedupe } from "@/lib/compiler/import-llm";
import {
  loadExistingObjectiveRefs,
  mergeIntoStrategicPlan,
  replaceStrategicPlan,
} from "@/lib/compiler/merge-import";
import { planObjectivesToBscRows } from "@/lib/data/strategic-plan-data";
import { assertPlanWritable } from "@/lib/strategy/plan-lifecycle";
import { getActivePeriod } from "@/lib/data/active-period";
import { persistHealthAssertionsFromContext } from "@/lib/data/health-assertion-data";

export const runtime = "nodejs";

const ORG_UNIT_ID = "org-group-rhautt";
const HORIZON_START = 2026;
const HORIZON_END = 2028;
const IMPORT_RATE_LIMIT = 8;
const IMPORT_RATE_WINDOW_MS = 10 * 60 * 1000;

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

  const session = await getSession();
  const rateKey = clientRateLimitKey(req, session?.email);
  const rate = checkRateLimit(`compiler-import:${rateKey}`, IMPORT_RATE_LIMIT, IMPORT_RATE_WINDOW_MS);
  if (!rate.ok) {
    return NextResponse.json(
      { error: "导入请求过于频繁，请稍后再试", retryAfterSec: rate.retryAfterSec },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSec ?? 60) } },
    );
  }

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
        rawText = rawText || (await extractTextFromDocument(buffer, file.name));
      }
    }

    if (mode === "replace" && !previewOnly) {
      const adminDenied = await requireApiAdmin();
      if (adminDenied) return adminDenied;
    }

    if (!rawText.trim()) {
      return NextResponse.json({ error: `无法从 ${fileName} 提取文本，请确认文件含可搜索文字` }, { status: 400 });
    }

    const { payload: compiled, engine: compileEngine } = await compileStrategicTextSmart(rawText);
    const planId = await ensurePlanId();
    const existingRefs =
      mode === "merge" || previewOnly ? await loadExistingObjectiveRefs(planId) : [];
    const existingTitles = existingRefs.flatMap((o) => [o.objective, ...o.keyResults]);
    const planMeta = await prisma.strategicPlan.findUnique({
      where: { id: planId },
      select: { intent: true, northStar: true },
    });
    let sanitized = sanitizeCompiledPayload(compiled, mode === "merge" ? existingTitles : []);
    // 合并模式：语义层对「本批接受项」与库内比对（不因规则 pre-filter 跳过 LLM）
    let semanticSource = sanitized;
    if (mode === "merge" && sanitized.stats.acceptedObjectives === 0 && compiled.objectives.length > 0) {
      semanticSource = sanitizeCompiledPayload(compiled, []);
    }
    const { sanitized: semanticSanitized, semantic } = await refineWithSemanticDedupe(
      semanticSource,
      existingTitles,
    );
    if (semanticSource !== sanitized) {
      // 规则已全判重时，以语义 refinement 结果作为合并输入
      sanitized = {
        ...semanticSanitized,
        stats: {
          ...sanitized.stats,
          acceptedObjectives: semanticSanitized.stats.acceptedObjectives,
          acceptedKeyResults: semanticSanitized.stats.acceptedKeyResults,
          rejectedCount: semanticSanitized.rejected.length,
        },
      };
    } else {
      sanitized = semanticSanitized;
    }
    const deduction = buildImportDeductionReport({
      mode,
      fileName,
      charCount: rawText.length,
      compiled,
      sanitized,
      existingObjectives: existingRefs,
      planIntent: planMeta?.intent,
      planNorthStar: planMeta?.northStar,
      semantic,
      compileEngine,
    });

    if (previewOnly) {
      return NextResponse.json({
        ok: true,
        fileName,
        mode,
        charCount: rawText.length,
        compiled: sanitized.payload,
        quality: sanitized.stats,
        rejected: sanitized.rejected.slice(0, 40),
        deduction,
        summary: [
          ...compiled.summary,
          deduction.recommendation,
          compileEngine !== "rules" ? `编译引擎: ${compileEngine}` : "",
          semantic.engine === "llm"
            ? `语义查重: 检 ${semantic.checked} · 去重 ${semantic.removedDuplicate} · 去噪 ${semantic.removedNoise}`
            : semantic.enabled
              ? "语义查重: 已配置但本次未命中"
              : "语义查重: 未配置 LLM（仅规则）",
          `质量: 原始 ${sanitized.stats.rawObjectives} → 接受 ${sanitized.stats.acceptedObjectives} · 剔除 ${sanitized.stats.rejectedCount}`,
        ].filter(Boolean),
      });
    }

    if (!previewOnly) {
      const writable = await assertPlanWritable(planId);
      if (!writable.ok) {
        return NextResponse.json({ error: writable.error, deduction }, { status: 423 });
      }
    }

    if (!deduction.safeToImport) {
      return NextResponse.json(
        {
          error: "推演阻断导入",
          deduction,
          risks: deduction.risks.filter((r) => r.level === "block"),
        },
        { status: 422 },
      );
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
          mustWinStatus: "yellow" as const,
          notFailStatus: "yellow" as const,
        })),
      );
      await saveDecodeBsc(derivedRows, await getActivePeriod(), { syncToPlan: false });
    } else if (mode === "replace" && compiled.bscRows.length > 0) {
      await saveDecodeBsc(compiled.bscRows, await getActivePeriod());
    }

    if (compiled.fpa) {
      const period = await getActivePeriod();
      const existing = await prisma.fpaPeriod.findFirst({
        where: { period, scope: "company" },
      });
      const existingCash = await prisma.cashPosition.findFirst({
        where: { period },
        orderBy: { asOfDate: "desc" },
      });
      const savedFpa = await saveFpaEditable(
        {
          revenueBudget: compiled.fpa.revenueBudget ?? Number(existing?.revenueBudget ?? 0),
          revenueActual: Number(existing?.revenueActual ?? 0),
          revenueForecast: compiled.fpa.revenueForecast ?? Number(existing?.revenueForecast ?? 0),
          profitBudget: compiled.fpa.profitBudget ?? Number(existing?.profitBudget ?? 0),
          profitActual: Number(existing?.profitActual ?? 0),
          profitForecast: compiled.fpa.profitForecast ?? Number(existing?.profitForecast ?? 0),
          cashRunwayMonths: existingCash ? Number(existingCash.runwayMonths) : 3,
        },
        period,
      );
      imported.push("FPA 数字已更新");
      await persistHealthAssertionsFromContext({
        trigger: "SHEET1_IMPORT",
        cashRunwayMonths: savedFpa.cashRunwayMonths,
      }).catch(() => undefined);
    }

    return NextResponse.json({
      ok: true,
      fileName,
      mode,
      charCount: rawText.length,
      compiled: sanitized.payload,
      quality: sanitized.stats,
      rejected: sanitized.rejected.slice(0, 40),
      deduction,
      imported,
      summary: compiled.summary,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "导入失败" }, { status: 500 });
  }
}
