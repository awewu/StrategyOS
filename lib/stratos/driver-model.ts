import type { FpaSummary } from "@/lib/types/stratos";

/**
 * Driver-based elasticities for counterfactual / what-if analysis.
 *
 * Every impact is expressed as an elasticity applied to a *baseline anchor*
 * read from the live FPA summary (revenue/profit/runway), instead of the
 * previous hard-coded absolute constants. This makes the model:
 *   - data-anchored: scales with the actual forecast, not a frozen number;
 *   - calibratable: elasticities can be overridden / fit from history;
 *   - unit-explicit: each field documents what it means.
 */
export interface DriverElasticities {
  /** Share of revenue forecast attributable to the V4 line, lost per quarter of delay. */
  v4RevenueSharePerQuarter: number;
  /** Share of revenue forecast represented by the hotel/large-project segment. */
  segmentRevenueShare: number;
  /** Gross margin used to convert a revenue delta into a profit delta. */
  grossMargin: number;
  /** Extra margin compression from a price cut, on top of the revenue effect. */
  priceCutMarginAmplifier: number;
  /** Runway months gained/lost per 1000 (万) of revenue change. */
  runwayMonthsPer1000Revenue: number;
  /** Direct runway months lost per unit (fraction) of price cut. */
  runwayMonthsPerPriceCutUnit: number;
}

/**
 * Defaults calibrated to reproduce the legacy demo magnitudes when anchored to
 * the FY26 baseline (revenueForecast ≈ 5800万), but now every term is a named,
 * override-able elasticity rather than a magic constant.
 */
export const DEFAULT_ELASTICITIES: DriverElasticities = {
  v4RevenueSharePerQuarter: 0.0345, // ≈ 200万/季 at 5800万 forecast
  segmentRevenueShare: 0.2759, // ≈ 1600万 hotel base at 5800万 forecast
  grossMargin: 0.15,
  priceCutMarginAmplifier: 0.1,
  runwayMonthsPer1000Revenue: 0.5,
  runwayMonthsPerPriceCutUnit: 2,
};

export interface DriverImpact {
  revenueDeltaM: number;
  profitDeltaM: number;
  runwayDeltaMonths: number;
}

function round(n: number): number {
  return Math.round(n);
}

/** Impact of delaying the V4 product line by `quarters`. */
export function v4DelayImpact(
  fpa: FpaSummary,
  quarters: number,
  e: DriverElasticities = DEFAULT_ELASTICITIES,
): DriverImpact {
  const q = Math.max(0, Math.min(4, quarters));
  const revenueDeltaM = round(-fpa.revenueForecast * e.v4RevenueSharePerQuarter * q);
  return {
    revenueDeltaM,
    profitDeltaM: round(revenueDeltaM * e.grossMargin),
    runwayDeltaMonths: (revenueDeltaM / 1000) * e.runwayMonthsPer1000Revenue,
  };
}

/** Impact of a segment (e.g. hotel) signing beat of fraction `beat` (0–0.5). */
export function segmentBeatImpact(
  fpa: FpaSummary,
  beat: number,
  e: DriverElasticities = DEFAULT_ELASTICITIES,
): DriverImpact {
  const b = Math.max(0, Math.min(0.5, beat));
  const revenueDeltaM = round(fpa.revenueForecast * e.segmentRevenueShare * b);
  return {
    revenueDeltaM,
    profitDeltaM: round(revenueDeltaM * (e.grossMargin - 0.03)),
    runwayDeltaMonths: (revenueDeltaM / 1000) * e.runwayMonthsPer1000Revenue,
  };
}

/** Impact of an across-the-board price cut of fraction `cut` (0–0.4). */
export function priceCutImpact(
  fpa: FpaSummary,
  cut: number,
  e: DriverElasticities = DEFAULT_ELASTICITIES,
): DriverImpact {
  const c = Math.max(0, Math.min(0.4, cut));
  const revenueDeltaM = round(-fpa.revenueForecast * c);
  const profitDeltaM = round(-fpa.profitForecast * (c + e.priceCutMarginAmplifier));
  return {
    revenueDeltaM,
    profitDeltaM,
    runwayDeltaMonths: -c * e.runwayMonthsPerPriceCutUnit,
  };
}
