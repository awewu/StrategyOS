/**
 * StratRobust internal-trend view (pure).
 *
 * Replaces the old 6-dim `composite ± constant` fabrication. Surfaces the real
 * 12 strategic-health dimensions — each with its own red/yellow/green signal —
 * plus period-over-period delta and an optional (never invented) target line.
 *
 * The builder is pure: getters resolve current/prior/target data and hand it
 * here for aggregation only. No fabrication, no hardcoded columns.
 */
import {
  pillarLabels,
  twelveDimensions,
  type TwelveDimension,
} from "./twelve-dimensions";
import type { TrafficLight } from "@/lib/types/stratos";

export { pillarLabels };

/** Per-dimension row shown in the trend view. */
export interface TwelveDimView extends TwelveDimension {
  /** Configured target line, or null when the strategy office has not set one. */
  target: number | null;
  /** Prior-period score, or null when there is no prior period on record. */
  prior: number | null;
  /** value − prior, or null when no prior exists. */
  delta: number | null;
}

/** Aggregated StratRobust view for a period. */
export interface RobustView {
  period: string;
  priorPeriod: string | null;
  source: "database" | "demo";
  dims: TwelveDimView[];
  /** Weighted composite of the 12 real dimensions (0–100). */
  overall: number;
  /** Weighted composite of the prior period, or null. */
  overallPrior: number | null;
  /** overall − overallPrior, or null. */
  overallDelta: number | null;
  /** Count of dimensions with a configured target line. */
  targetsSet: number;
}

/** Live value for one dimension, resolved from DB or demo registry. */
export interface RobustDimInput {
  score: number;
  signal: TrafficLight;
  target?: number | null;
}

/** Weighted composite over (score, weight) pairs. Returns 0 for empty input. */
export function weightedComposite(rows: Array<{ score: number; weight: number }>): number {
  const w = rows.reduce((s, r) => s + r.weight, 0);
  if (w === 0) return 0;
  const total = rows.reduce((s, r) => s + r.score * r.weight, 0);
  return Math.round(total / w);
}

/**
 * Build the StratRobust trend view from resolved inputs. Iterates the canonical
 * 12-dimension registry so ordering / name / pillar / weight are authoritative,
 * and layers current value + signal + target + prior/delta on top.
 */
export function buildRobustView(args: {
  period: string;
  priorPeriod: string | null;
  source: "database" | "demo";
  /** dimId → live current input. Missing dims fall back to the registry defaults. */
  current: Record<string, RobustDimInput>;
  /** dimId → prior-period score, or null when no prior period exists. */
  prior: Record<string, number> | null;
}): RobustView {
  const { period, priorPeriod, source, current, prior } = args;

  const dims: TwelveDimView[] = twelveDimensions.map((base) => {
    const cur = current[base.id];
    const value = cur?.score ?? base.score;
    const signal = cur?.signal ?? base.signal;
    const target = cur?.target ?? null;
    const priorScore = prior ? (prior[base.id] ?? null) : null;
    const delta = priorScore == null ? null : value - priorScore;
    return { ...base, score: value, signal, target, prior: priorScore, delta };
  });

  const overall = weightedComposite(dims.map((d) => ({ score: d.score, weight: d.weight })));

  let overallPrior: number | null = null;
  if (prior) {
    const priorRows = dims
      .filter((d) => d.prior != null)
      .map((d) => ({ score: d.prior as number, weight: d.weight }));
    overallPrior = priorRows.length ? weightedComposite(priorRows) : null;
  }
  const overallDelta = overallPrior == null ? null : overall - overallPrior;
  const targetsSet = dims.filter((d) => d.target != null).length;

  return { period, priorPeriod, source, dims, overall, overallPrior, overallDelta, targetsSet };
}
