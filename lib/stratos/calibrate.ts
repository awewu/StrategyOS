/**
 * Calibration utilities — turn historical Budget/Actual/Forecast history into
 * model parameters.
 *
 * This addresses the "heuristic hard-coded coefficients" gap: forecast bias is
 * fit from data instead of assumed.
 */

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

/**
 * Minimum history points before the fitted bias is applied at full strength.
 * With fewer points the correction is linearly shrunk toward zero so a single
 * noisy period cannot swing the forecast.
 */
export const BIAS_FULL_STRENGTH_N = 3;

/**
 * Apply a fitted bias to debias a forward forecast (shrinks optimistic plans).
 * The correction is scaled by min(n, BIAS_FULL_STRENGTH_N) / BIAS_FULL_STRENGTH_N
 * so sparse history (n < 3) only partially corrects.
 */
export function applyForecastBias(forecast: number, cal: ForecastCalibration): number {
  if (cal.n === 0) return forecast;
  const strength = Math.min(cal.n, BIAS_FULL_STRENGTH_N) / BIAS_FULL_STRENGTH_N;
  return forecast * (1 + cal.biasPct * strength);
}
