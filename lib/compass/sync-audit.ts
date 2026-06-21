import { prisma } from "@/lib/db";
import type { AssumptionResult, AssumptionType } from "@prisma/client";

const PERIOD = "2026-FY";
const RUNWAY_SAFE_MONTHS = 3;

function assumptionCategory(type: AssumptionType): string {
  switch (type) {
    case "product":
      return "technology";
    case "gtm":
      return "capability";
    case "capital":
      return "market";
    default:
      return "market";
  }
}

function confidenceFromResult(result: AssumptionResult): number {
  switch (result) {
    case "validated":
      return 82;
    case "failed":
      return 28;
    default:
      return 58;
  }
}

function fragilityFromAssumption(type: AssumptionType, result: AssumptionResult): number {
  if (result === "failed") return 92;
  if (type === "capital") return 90;
  if (type === "product") return 85;
  if (type === "gtm") return 75;
  return 65;
}

function isAutoSignal(source: string | null | undefined): boolean {
  return Boolean(source?.startsWith("自动·"));
}

function isCapitalPremise(code: string, premise: string): boolean {
  if (code === "P5") return true;
  const text = premise.toLowerCase();
  return text.includes("runway") || text.includes("现金") || text.includes("资本");
}

/** 从 assumptions 表 upsert 到 compassPremiseAudit（按 code 对齐，保留 Hermes 联动） */
export async function syncPremisesFromAssumptions(northStarId: string): Promise<number> {
  const assumptions = await prisma.assumption.findMany({
    where: { period: PERIOD },
    orderBy: { code: "asc" },
  });
  if (assumptions.length === 0) return 0;

  let synced = 0;
  for (const a of assumptions) {
    const existing = await prisma.compassPremiseAudit.findFirst({
      where: { northStarId, code: a.code },
    });
    const data = {
      premise: a.content,
      category: assumptionCategory(a.assumptionType),
      confidence: confidenceFromResult(a.result),
      fragility: fragilityFromAssumption(a.assumptionType, a.result),
      validationNote: a.validationMethod ?? a.failureImpact ?? "来自战略假设库同步",
      lastValidatedAt: new Date(),
      ...(a.result === "failed" && a.failureImpact
        ? {
            failSignal: a.failureImpact,
            signalSource: "自动·假设库",
            signalAt: new Date(),
          }
        : {}),
    };

    if (existing) {
      const keepManualFail =
        existing.failSignal && !isAutoSignal(existing.signalSource) && a.result !== "failed";
      await prisma.compassPremiseAudit.update({
        where: { id: existing.id },
        data: keepManualFail
          ? {
              premise: data.premise,
              category: data.category,
              confidence: data.confidence,
              fragility: data.fragility,
              validationNote: data.validationNote,
              lastValidatedAt: data.lastValidatedAt,
            }
          : data,
      });
    } else {
      await prisma.compassPremiseAudit.create({
        data: { northStarId, code: a.code, ...data },
      });
    }
    synced++;
  }
  return synced;
}

async function loadRunwayMonths(): Promise<number | null> {
  const cash = await prisma.cashPosition.findFirst({
    where: { period: PERIOD },
    orderBy: { asOfDate: "desc" },
  });
  if (cash) return Number(cash.runwayMonths);
  const assertion = await prisma.healthAssertion.findFirst({
    where: { active: true, assertionType: "runway" },
    orderBy: { triggeredAt: "desc" },
  });
  if (assertion?.metricValue) return Number(assertion.metricValue);
  return null;
}

async function loadHermesThreatSignals() {
  try {
    const rows = await prisma.intelSignal.findMany({
      where: {
        impact: "threat",
        linkedAssumptionCode: { not: null },
        verdict: { in: ["supported", "partial"] },
      },
      orderBy: [{ relevance: "desc" }, { capturedAt: "desc" }],
      take: 20,
    });
    return rows.map((s) => ({
      code: s.linkedAssumptionCode!,
      title: s.title,
      summary: s.summary,
      source: `自动·Hermes · ${s.competitor}`,
      at: s.capturedAt,
    }));
  } catch {
    return [];
  }
}

/** FPA runway + Hermes 威胁信号 + 假设库 failed → 写入 failSignal */
export async function applyAutoFailSignals(northStarId: string): Promise<number> {
  const premises = await prisma.compassPremiseAudit.findMany({ where: { northStarId } });
  if (premises.length === 0) return 0;

  let updated = 0;
  const runway = await loadRunwayMonths();

  if (runway !== null) {
    for (const p of premises) {
      if (!isCapitalPremise(p.code, p.premise)) continue;
      if (runway < RUNWAY_SAFE_MONTHS) {
        const msg = `现金 runway ${runway.toFixed(1)} 月，低于安全线 ${RUNWAY_SAFE_MONTHS} 月`;
        if (p.failSignal !== msg || p.signalSource !== "自动·FPA") {
          if (!p.failSignal || isAutoSignal(p.signalSource)) {
            await prisma.compassPremiseAudit.update({
              where: { id: p.id },
              data: {
                failSignal: msg,
                signalSource: "自动·FPA",
                signalAt: new Date(),
                confidence: Math.min(p.confidence, 35),
                fragility: Math.max(p.fragility, 90),
              },
            });
            updated++;
          }
        }
      } else if (p.signalSource === "自动·FPA") {
        await prisma.compassPremiseAudit.update({
          where: { id: p.id },
          data: { failSignal: null, signalSource: null, signalAt: null },
        });
        updated++;
      }
    }
  }

  const hermes = await loadHermesThreatSignals();
  for (const sig of hermes) {
    const p = premises.find((row) => row.code === sig.code);
    if (!p) continue;
    const msg = `${sig.title}：${sig.summary.slice(0, 120)}`;
    if (p.failSignal === msg && p.signalSource === sig.source) continue;
    if (p.failSignal && !isAutoSignal(p.signalSource)) continue;
    await prisma.compassPremiseAudit.update({
      where: { id: p.id },
      data: {
        failSignal: msg,
        signalSource: sig.source,
        signalAt: sig.at,
        confidence: Math.min(p.confidence, 45),
        fragility: Math.max(p.fragility, 80),
      },
    });
    updated++;
  }

  const failed = await prisma.assumption.findMany({
    where: { period: PERIOD, result: "failed" },
  });
  for (const a of failed) {
    const p = premises.find((row) => row.code === a.code);
    if (!p) continue;
    const msg = a.failureImpact ?? `假设 ${a.code} 已标记失效：${a.content}`;
    if (p.failSignal && !isAutoSignal(p.signalSource)) continue;
    await prisma.compassPremiseAudit.update({
      where: { id: p.id },
      data: {
        failSignal: msg,
        signalSource: "自动·假设库",
        signalAt: new Date(),
        confidence: 25,
        fragility: 92,
      },
    });
    updated++;
  }

  return updated;
}

export async function refreshCompassAudit(
  northStarId: string,
  opts: { assumptions?: boolean; signals?: boolean } = { assumptions: false, signals: true },
): Promise<{ assumptionsSynced: number; signalsApplied: number }> {
  let assumptionsSynced = 0;
  let signalsApplied = 0;
  if (opts.assumptions) assumptionsSynced = await syncPremisesFromAssumptions(northStarId);
  if (opts.signals) signalsApplied = await applyAutoFailSignals(northStarId);
  return { assumptionsSynced, signalsApplied };
}
