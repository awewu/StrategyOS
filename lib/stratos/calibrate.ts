import type { FpaSummary } from "@/lib/types/stratos";
import { DEFAULT_SIM_SEED, type SimSeed } from "./strat-sim";
import type { DynamicsState } from "./strat-sim-dynamics";

/**
 * Calibration utilities — turn historical Budget/Actual/Forecast history into
 * model parameters, and seed simulations from live FPA instead of constants.
 *
 * This addresses the "heuristic hard-coded coefficients" gap: forecast bias is
 * fit from data, and simulation initial states are derived from the actual
 * financial position.
 */

/** The implicit cash burn per runway-month used by the stock/flow model. */
export const CASH_PER_RUNWAY_MONTH = 800;

export interface BafPoint {
  /** Budget (plan) value. */
  budget: number;
  /** Actual realized value. */
  actual: number;
}

export interface ForecastCalibration {
  /** Mean signed bias: average (actual - budget) / budget. Negative = optimistic plans. */
  biasPct: number;
  /** Mean absolute percentage error of plans vs actuals. */
  mape: number;
  /** Number of historical points used. */
  n: number;
}

/**
 * Fit forecast bias & error from historical Budget vs Actual pairs.
 * Use `applyForecastBias` to debias a forward forecast.
 */
export function calibrateForecastBias(points: BafPoint[]): ForecastCalibration {
  const valid = points.filter((p) => Number.isFinite(p.budget) && p.budget !== 0);
  if (valid.length === 0) return { biasPct: 0, mape: 0, n: 0 };

  let biasSum = 0;
  let apeSum = 0;
  for (const p of valid) {
    const err = (p.actual - p.budget) / p.budget;
    biasSum += err;
    apeSum += Math.abs(err);
  }
  return {
    biasPct: biasSum / valid.length,
    mape: apeSum / valid.length,
    n: valid.length,
  };
}

/** Apply a fitted bias to debias a forward forecast (shrinks optimistic plans). */
export function applyForecastBias(forecast: number, cal: ForecastCalibration): number {
  if (cal.n === 0) return forecast;
  return forecast * (1 + cal.biasPct);
}

/**
 * Derive the strat-sim seed from the live FPA summary. Financial stocks are
 * anchored to real numbers; operating defaults (signings/winRate/...) are kept
 * unless overridden, since they are not present in FPA.
 */
export function deriveSimSeed(fpa: FpaSummary, base: SimSeed = DEFAULT_SIM_SEED): SimSeed {
  return {
    ...base,
    profit: Number.isFinite(fpa.profitActual) ? fpa.profitActual : base.profit,
    runway: Number.isFinite(fpa.cashRunwayMonths) ? fpa.cashRunwayMonths : base.runway,
  };
}

/**
 * Derive the stock/flow initial state from FPA. Cash is reconstructed from the
 * runway (cash ≈ runwayMonths × burn/month), keeping the model consistent with
 * the dynamics' runway = cash / burn relationship.
 */
export function deriveDynamicsInitial(
  fpa: FpaSummary,
  behavioral: DynamicsState,
): DynamicsState {
  return {
    ...behavioral,
    cash: Number.isFinite(fpa.cashRunwayMonths)
      ? fpa.cashRunwayMonths * CASH_PER_RUNWAY_MONTH
      : behavioral.cash,
    profit: Number.isFinite(fpa.profitActual) ? fpa.profitActual : behavioral.profit,
  };
}
