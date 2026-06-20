import type {
  DiffCategory,
  FpaSummary,
  SnapshotStatePayload,
} from "@/lib/types/stratos";

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

const V4_REVENUE_PER_Q = 200;
const HOTEL_BASE_REVENUE_M = 1600;
const RUNWAY_PER_V4_Q = 0.35;
const RUNWAY_PER_HOTEL_BEAT = 0.08;

function baselineFpa(state: SnapshotStatePayload): FpaSummary {
  return (
    state.fpa ?? {
      revenueBudget: 6000,
      revenueActual: 4200,
      revenueForecast: 5800,
      profitBudget: 880,
      profitActual: 520,
      profitForecast: 820,
      cashRunwayMonths: 3.5,
    }
  );
}

export function runCounterfactual(
  baseline: SnapshotStatePayload,
  input: CounterfactualInput
): CounterfactualResult {
  const fpa = baselineFpa(baseline);
  const mag = Math.max(0, input.magnitude);

  switch (input.type) {
    case "v4_delay": {
      const q = Math.min(4, mag);
      const revenueDelta = -V4_REVENUE_PER_Q * q;
      const runway = Math.max(0.5, fpa.cashRunwayMonths - RUNWAY_PER_V4_Q * q);
      return {
        id: `cf-v4-delay-${q}`,
        premise: `若 V4 延迟 ${q} 个季度`,
        impact: `营收 F ${revenueDelta} 万 · runway ${runway.toFixed(1)} 月 · IC-04 可能进入 deferred`,
        linkedDiff: ["FPA_FORECAST", "ROADMAP_SLIP"],
        metrics: {
          revenueDeltaM: revenueDelta,
          runwayMonths: runway,
          profitDeltaM: revenueDelta * 0.15,
        },
      };
    }
    case "hotel_beat": {
      const pct = Math.min(0.5, mag);
      const revenueDelta = Math.round(HOTEL_BASE_REVENUE_M * pct);
      const runway = fpa.cashRunwayMonths + RUNWAY_PER_HOTEL_BEAT * pct * 100;
      return {
        id: `cf-hotel-beat-${Math.round(pct * 100)}`,
        premise: `若酒店签约超额 ${Math.round(pct * 100)}%`,
        impact: `营收 F +${revenueDelta} 万 · runway ${runway.toFixed(1)} 月 · 涌现模式写入 deliberate 候选`,
        linkedDiff: ["EMERGENT_PATTERN", "COVERAGE_TARGET"],
        metrics: {
          revenueDeltaM: revenueDelta,
          runwayMonths: runway,
          profitDeltaM: revenueDelta * 0.12,
        },
      };
    }
    case "price_cut": {
      const cut = Math.min(0.4, mag);
      const revenueDelta = Math.round(-fpa.revenueForecast * cut);
      const profitDelta = Math.round(-fpa.profitForecast * (cut + 0.1));
      const runway = Math.max(0.5, fpa.cashRunwayMonths - cut * 2);
      return {
        id: `cf-price-cut-${Math.round(cut * 100)}`,
        premise: `若全品类降价 ${Math.round(cut * 100)}%`,
        impact: `营收 F ${revenueDelta} 万 · 利润 F ${profitDelta} 万 · runway ${runway.toFixed(1)} 月`,
        linkedDiff: ["FPA_FORECAST", "LTV_CAC_DETERIORATION"],
        metrics: {
          revenueDeltaM: revenueDelta,
          runwayMonths: runway,
          profitDeltaM: profitDelta,
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
