import { dbAvailable, prisma } from "@/lib/db";
import { getActivePeriod } from "@/lib/data/active-period";
import { parseDecisionsJson } from "@/lib/command/decisions-access";
import type { DecisionItem } from "@/lib/panorama/scr";

/**
 * 决策复盘：把历史期次落账的决策和该期实际 B-A 落点放在一起，
 * 生成"当初决了什么 · 实际发生了什么"的复盘卡（进 /council 复盘 tab）。
 */

export type DecisionReviewCard = {
  period: string;
  decisions: DecisionItem[];
  /** 该期 B-A 偏差（实际 vs 预算），null = 该期无 FPA 数据 */
  actuals: {
    revenueBudget: number;
    revenueActual: number;
    profitBudget: number;
    profitActual: number;
    revenueVariancePct: number | null;
    profitVariancePct: number | null;
  } | null;
};

function variancePct(budget: number, actual: number): number | null {
  if (!budget) return null;
  return (actual - budget) / budget;
}

export async function getDecisionReviewCards(limit = 4): Promise<DecisionReviewCard[]> {
  if (!(await dbAvailable())) return [];
  const activePeriod = await getActivePeriod();

  const rows = await prisma.strategicCommandConfig.findMany({
    where: { period: { lt: activePeriod } },
    orderBy: { period: "desc" },
    take: limit,
  });

  const cards: DecisionReviewCard[] = [];
  for (const row of rows) {
    if (row.decisionsJson == null) continue;
    let decisions: DecisionItem[];
    try {
      decisions = parseDecisionsJson(row.decisionsJson);
    } catch {
      continue;
    }

    const fpa = await prisma.fpaPeriod.findFirst({
      where: { period: row.period, scope: "company" },
    });
    const actuals = fpa
      ? {
          revenueBudget: Number(fpa.revenueBudget),
          revenueActual: Number(fpa.revenueActual),
          profitBudget: Number(fpa.profitBudget),
          profitActual: Number(fpa.profitActual),
          revenueVariancePct: variancePct(Number(fpa.revenueBudget), Number(fpa.revenueActual)),
          profitVariancePct: variancePct(Number(fpa.profitBudget), Number(fpa.profitActual)),
        }
      : null;

    cards.push({ period: row.period, decisions, actuals });
  }
  return cards;
}
