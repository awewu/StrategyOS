import type {
  DiffCategory,
  FpaSummary,
  SnapshotStatePayload,
} from "@/lib/types/stratos";
import {
  DEFAULT_ELASTICITIES,
  priceCutImpact,
  segmentBeatImpact,
  v4DelayImpact,
  type DriverElasticities,
} from "./driver-model";

export type CounterfactualType = "v4_delay" | "hotel_beat" | "price_cut";

export interface CounterfactualInput {
  type: CounterfactualType;
  /** v4_delay: quarters delayed; hotel_beat: beat %; price_cut: cut fraction 0–1 */
  magnitude: number;
}

export interface CounterfactualResult {
  id: string;
  premise: string;
  impact: string;
  linkedDiff: DiffCategory[];
  metrics: {
    revenueDeltaM: number;
    runwayMonths: number;
    profitDeltaM?: number;
  };
}

/** Fallback baseline used only when a snapshot carries no FPA summary. */
const FALLBACK_FPA: FpaSummary = {
  revenueBudget: 6000,
  revenueActual: 4200,
  revenueForecast: 5800,
  profitBudget: 880,
  profitActual: 520,
  profitForecast: 820,
  cashRunwayMonths: 3.5,
};

function baselineFpa(state: SnapshotStatePayload): FpaSummary {
  return state.fpa ?? FALLBACK_FPA;
}

function clampRunway(months: number): number {
  return Math.max(0.5, months);
}

/**
 * Run a counterfactual via the data-anchored driver model. Impacts scale with
 * the snapshot's actual FPA forecast; elasticities are override-able for
 * calibration. The model is directional (for facilitated what-if), not a
 * point forecast — pair with monteCarloForecast for probabilistic ranges.
 */
export function runCounterfactual(
  baseline: SnapshotStatePayload,
  input: CounterfactualInput,
  elasticities: DriverElasticities = DEFAULT_ELASTICITIES,
): CounterfactualResult {
  const fpa = baselineFpa(baseline);
  const mag = Math.max(0, input.magnitude);

  switch (input.type) {
    case "v4_delay": {
      const q = Math.min(4, mag);
      const impact = v4DelayImpact(fpa, q, elasticities);
      const runway = clampRunway(fpa.cashRunwayMonths + impact.runwayDeltaMonths);
      return {
        id: `cf-v4-delay-${q}`,
        premise: `若 V4 延迟 ${q} 个季度`,
        impact: `营收 F ${impact.revenueDeltaM} 万 · runway ${runway.toFixed(1)} 月 · IC-04 可能进入 deferred`,
        linkedDiff: ["FPA_FORECAST", "ROADMAP_SLIP"],
        metrics: {
          revenueDeltaM: impact.revenueDeltaM,
          runwayMonths: runway,
          profitDeltaM: impact.profitDeltaM,
        },
      };
    }
    case "hotel_beat": {
      const pct = Math.min(0.5, mag);
      const impact = segmentBeatImpact(fpa, pct, elasticities);
      const runway = clampRunway(fpa.cashRunwayMonths + impact.runwayDeltaMonths);
      return {
        id: `cf-hotel-beat-${Math.round(pct * 100)}`,
        premise: `若酒店签约超额 ${Math.round(pct * 100)}%`,
        impact: `营收 F +${impact.revenueDeltaM} 万 · runway ${runway.toFixed(1)} 月 · 涌现模式写入 deliberate 候选`,
        linkedDiff: ["EMERGENT_PATTERN", "COVERAGE_TARGET"],
        metrics: {
          revenueDeltaM: impact.revenueDeltaM,
          runwayMonths: runway,
          profitDeltaM: impact.profitDeltaM,
        },
      };
    }
    case "price_cut": {
      const cut = Math.min(0.4, mag);
      const impact = priceCutImpact(fpa, cut, elasticities);
      const runway = clampRunway(fpa.cashRunwayMonths + impact.runwayDeltaMonths);
      return {
        id: `cf-price-cut-${Math.round(cut * 100)}`,
        premise: `若全品类降价 ${Math.round(cut * 100)}%`,
        impact: `营收 F ${impact.revenueDeltaM} 万 · 利润 F ${impact.profitDeltaM} 万 · runway ${runway.toFixed(1)} 月`,
        linkedDiff: ["FPA_FORECAST", "LTV_CAC_DETERIORATION"],
        metrics: {
          revenueDeltaM: impact.revenueDeltaM,
          runwayMonths: runway,
          profitDeltaM: impact.profitDeltaM,
        },
      };
    }
    default:
      throw new Error(`Unknown counterfactual type: ${String(input.type)}`);
  }
}

export const COUNTERFACTUAL_PRESETS: Array<{
  type: CounterfactualType;
  magnitude: number;
  label: string;
}> = [
  { type: "v4_delay", magnitude: 2, label: "V4 延迟 2 季" },
  { type: "hotel_beat", magnitude: 0.2, label: "酒店超额 20%" },
  { type: "price_cut", magnitude: 0.1, label: "降价 10%" },
];
