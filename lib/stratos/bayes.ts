/**
 * Real Bayesian updating — posterior ∝ prior × likelihood, normalized.
 *
 * This replaces the previous additive "nudge" with a proper probabilistic
 * update so that:
 *   - evidence enters as a likelihood (ratio), not an arbitrary ±%;
 *   - updates are order-independent for independent evidence (commutative);
 *   - uniform/uninformative likelihood leaves the prior unchanged.
 */

/** Normalize non-negative weights to a probability vector summing to 1. */
export function normalize(weights: number[]): number[] {
  const safe = weights.map((w) => (Number.isFinite(w) && w > 0 ? w : 0));
  const total = safe.reduce((a, w) => a + w, 0);
  if (total <= 0) return weights.map(() => 1 / weights.length);
  return safe.map((w) => w / total);
}

/** Single Bayesian update: P(H|E) ∝ P(H) · P(E|H). Returns a normalized vector. */
export function bayesianPosterior(priors: number[], likelihoods: number[]): number[] {
  if (priors.length !== likelihoods.length) {
    throw new Error("bayesianPosterior: priors and likelihoods length mismatch");
  }
  const prior = normalize(priors);
  const unnorm = prior.map((p, i) => p * Math.max(0, likelihoods[i]));
  return normalize(unnorm);
}

/** Apply independent evidence likelihood vectors in sequence. */
export function bayesianUpdateSequence(priors: number[], evidences: number[][]): number[] {
  return evidences.reduce((post, lik) => bayesianPosterior(post, lik), normalize(priors));
}

/**
 * Convert a probability vector (fractions summing to ~1) into integer percents
 * that sum to exactly 100, using the largest-remainder (Hare) method.
 */
export function toIntegerPercents(fractions: number[]): number[] {
  const scaled = fractions.map((f) => f * 100);
  const floors = scaled.map((x) => Math.floor(x));
  let remainder = 100 - floors.reduce((a, x) => a + x, 0);
  const order = scaled
    .map((x, i) => ({ i, frac: x - Math.floor(x) }))
    .sort((a, b) => b.frac - a.frac);
  const out = [...floors];
  for (let k = 0; k < order.length && remainder > 0; k++) {
    out[order[k].i] += 1;
    remainder -= 1;
  }
  return out;
}
