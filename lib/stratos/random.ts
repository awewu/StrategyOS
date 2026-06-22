/**
 * Deterministic, seedable PRNG + sampling helpers for Monte Carlo.
 * Determinism (fixed seed → identical output) is required so simulations are
 * reproducible across runs, reviews, and tests.
 */

/** mulberry32 — fast, well-distributed 32-bit seeded PRNG in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Standard normal sample via Box–Muller from a uniform generator. */
export function randNormal(rng: () => number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** Pick an index from a cumulative-probability array given a uniform draw. */
export function pickIndex(cumulative: number[], u: number): number {
  for (let i = 0; i < cumulative.length; i++) {
    if (u <= cumulative[i]) return i;
  }
  return cumulative.length - 1;
}

/** Cumulative sum of a probability vector. */
export function cumulative(probs: number[]): number[] {
  const out: number[] = [];
  let acc = 0;
  for (const p of probs) {
    acc += p;
    out.push(acc);
  }
  return out;
}

export interface Percentiles {
  p10: number;
  p50: number;
  p90: number;
  mean: number;
  min: number;
  max: number;
}

/** Percentile (linear interpolation) of an unsorted numeric sample. */
export function percentile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

/** Summary stats (P10/P50/P90/mean/min/max) of a sample. */
export function summarize(sample: number[]): Percentiles {
  if (sample.length === 0) {
    return { p10: 0, p50: 0, p90: 0, mean: 0, min: 0, max: 0 };
  }
  const sorted = [...sample].sort((a, b) => a - b);
  const mean = sample.reduce((a, x) => a + x, 0) / sample.length;
  return {
    p10: percentile(sorted, 0.1),
    p50: percentile(sorted, 0.5),
    p90: percentile(sorted, 0.9),
    mean,
    min: sorted[0],
    max: sorted[sorted.length - 1],
  };
}
