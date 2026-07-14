/**
 * Forecast calibration from real history — separates demo seeds from data.
 *
 * Collects Budget-vs-Actual points from the live FPA period and any frozen
 * snapshots' stored state, then fits a bias/MAPE used to debias forward
 * forecasts in counterfactual / Monte-Carlo analysis.
 */
import { dbAvailable, prisma, safeDbQuery } from "@/lib/db";
import { getFpaSummary } from "@/lib/data/strategy-data";
import {
  calibrateForecastBias,
  type BafPoint,
  type ForecastCalibration,
} from "@/lib/stratos/calibrate";
import type { FpaSummary } from "@/lib/types/stratos";

function pointsFromFpa(fpa: FpaSummary | null | undefined): BafPoint[] {
  if (!fpa) return [];
  const out: BafPoint[] = [];
  if (fpa.revenueBudget) out.push({ budget: fpa.revenueBudget, actual: fpa.revenueActual });
  if (fpa.profitBudget) out.push({ budget: fpa.profitBudget, actual: fpa.profitActual });
  return out;
}

export async function getForecastCalibration(): Promise<ForecastCalibration> {
  const current = await getFpaSummary();
  const points: BafPoint[] = [...pointsFromFpa(current)];

  if (await dbAvailable()) {
    const [rows, fpaHistory] = await Promise.all([
      safeDbQuery(
        () =>
          prisma.strategicSnapshot.findMany({
            where: { status: "FROZEN" },
            orderBy: { frozenAt: "asc" },
            take: 20,
          }),
        [] as { stateJson: unknown }[],
      ),
      // 全部历史期次的 B vs A — 预算↔实际偏差随每期关账自动累积进校准
      safeDbQuery(
        () =>
          prisma.fpaPeriod.findMany({
            where: { scope: "company" },
            orderBy: { period: "asc" },
            take: 60,
            select: {
              revenueBudget: true,
              revenueActual: true,
              profitBudget: true,
              profitActual: true,
            },
          }),
        [] as {
          revenueBudget: unknown;
          revenueActual: unknown;
          profitBudget: unknown;
          profitActual: unknown;
        }[],
      ),
    ]);
    for (const r of rows) {
      const st = r.stateJson as { fpa?: FpaSummary } | null;
      points.push(...pointsFromFpa(st?.fpa));
    }
    for (const p of fpaHistory) {
      const revB = Number(p.revenueBudget);
      const revA = Number(p.revenueActual);
      const proB = Number(p.profitBudget);
      const proA = Number(p.profitActual);
      if (revB) points.push({ budget: revB, actual: revA });
      if (proB) points.push({ budget: proB, actual: proA });
    }
  }

  return calibrateForecastBias(points);
}
