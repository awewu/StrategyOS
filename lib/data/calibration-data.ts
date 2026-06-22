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
    const rows = await safeDbQuery(
      () =>
        prisma.strategicSnapshot.findMany({
          where: { status: "FROZEN" },
          orderBy: { frozenAt: "asc" },
          take: 20,
        }),
      [] as { stateJson: unknown }[],
    );
    for (const r of rows) {
      const st = r.stateJson as { fpa?: FpaSummary } | null;
      points.push(...pointsFromFpa(st?.fpa));
    }
  }

  return calibrateForecastBias(points);
}
