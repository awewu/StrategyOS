/**
 * Bidirectional sync: 编制战略 PlanAssumption ↔ 罗盘 PlanPremise.
 * Canonical premise codes: P1…Pn; global assumption library H1…Hn maps to same slot.
 */
import { prisma } from "@/lib/db";

/** H2 → P2, P2 → P2, unknown codes uppercased as-is */
export function normalizePremiseCode(code: string): string {
  const trimmed = code.trim();
  const h = /^H(\d+)$/i.exec(trimmed);
  if (h) return `P${h[1]}`;
  const p = /^P(\d+)$/i.exec(trimmed);
  if (p) return `P${p[1]}`;
  return trimmed.toUpperCase();
}

export function premiseMatchesCode(premiseCode: string, refCode: string): boolean {
  return normalizePremiseCode(premiseCode) === normalizePremiseCode(refCode);
}

export function premiseCodeForIndex(index: number): string {
  return `P${index + 1}`;
}

function parsePremiseIndex(code: string): number {
  const normalized = normalizePremiseCode(code);
  const m = /^P(\d+)$/i.exec(normalized);
  return m ? Number(m[1]) - 1 : 999;
}

function categoryFromCritical(critical: boolean): string {
  return critical ? "market" : "capability";
}

/** 编制战略关键假设 → 罗盘前提审计 */
export async function syncPlanAssumptionsToPremises(planId: string): Promise<number> {
  const assumptions = await prisma.planAssumption.findMany({
    where: { planId },
    orderBy: { createdAt: "asc" },
  });
  if (assumptions.length === 0) return 0;

  let synced = 0;
  for (let i = 0; i < assumptions.length; i++) {
    const a = assumptions[i]!;
    const code = premiseCodeForIndex(i);
    const existing = await prisma.planPremise.findFirst({ where: { planId, code } });
    const data = {
      premise: a.assumption.trim(),
      category: categoryFromCritical(a.critical),
      confidence: a.critical ? 45 : 65,
      fragility: a.critical ? 85 : 60,
      validationNote: a.critical ? "编制战略 · 关键假设" : "编制战略 · 假设",
      lastValidatedAt: new Date(),
      sortOrder: i,
    };

    if (existing) {
      const keepSignals = existing.failSignal && existing.signalSource?.startsWith("自动·");
      await prisma.planPremise.update({
        where: { id: existing.id },
        data: keepSignals
          ? {
              premise: data.premise,
              category: data.category,
              confidence: data.confidence,
              fragility: data.fragility,
              validationNote: data.validationNote,
              lastValidatedAt: data.lastValidatedAt,
              sortOrder: data.sortOrder,
            }
          : data,
      });
    } else {
      await prisma.planPremise.create({ data: { planId, code, ...data } });
    }
    synced++;
  }
  return synced;
}

/** 罗盘前提审计 → 编制战略关键假设 */
export async function syncPlanPremisesToAssumptions(planId: string): Promise<number> {
  const premises = await prisma.planPremise.findMany({
    where: { planId },
    orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
  });
  const sorted = [...premises].sort(
    (a, b) => parsePremiseIndex(a.code) - parsePremiseIndex(b.code) || a.sortOrder - b.sortOrder,
  );
  const withText = sorted.filter((p) => p.premise.trim());
  if (withText.length === 0) return 0;

  await prisma.$transaction(async (tx) => {
    await tx.planAssumption.deleteMany({ where: { planId } });
    for (const p of withText) {
      await tx.planAssumption.create({
        data: {
          planId,
          assumption: p.premise.trim(),
          critical: p.fragility >= 70 || Boolean(p.failSignal),
        },
      });
    }
  });

  return withText.length;
}

/** 双向合并：以较新内容为准（premise 有自动信号时保留 premise 文本外的字段） */
export async function syncPlanAssumptionsAndPremises(planId: string): Promise<{
  assumptionsToPremises: number;
  premisesToAssumptions: number;
}> {
  const [assumptionCount, premiseCount] = await Promise.all([
    prisma.planAssumption.count({ where: { planId } }),
    prisma.planPremise.count({ where: { planId } }),
  ]);

  if (assumptionCount === 0 && premiseCount === 0) {
    return { assumptionsToPremises: 0, premisesToAssumptions: 0 };
  }
  if (assumptionCount > 0 && premiseCount === 0) {
    return {
      assumptionsToPremises: await syncPlanAssumptionsToPremises(planId),
      premisesToAssumptions: 0,
    };
  }
  if (premiseCount > 0 && assumptionCount === 0) {
    return {
      assumptionsToPremises: 0,
      premisesToAssumptions: await syncPlanPremisesToAssumptions(planId),
    };
  }

  const assumptionsToPremises = await syncPlanAssumptionsToPremises(planId);
  return { assumptionsToPremises, premisesToAssumptions: 0 };
}
