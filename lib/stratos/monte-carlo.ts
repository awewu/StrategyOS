import type { Scenario } from "@/lib/types/stratos";
import { normalize } from "./bayes";
import {
  cumulative,
  mulberry32,
  pickIndex,
  randNormal,
  summarize,
  type Percentiles,
} from "./random";

export interface MonteCarloOptions {
  /** Number of trials. Default 10000. */
  iterations?: number;
  /** Within-scenario coefficient of variation (lognormal noise). Default 0.08. */
  cv?: number;
  /** PRNG seed for reproducibility. Default 42. */
  seed?: number;
  /** Runway safety threshold (months) for breach probability. Default 3. */
  runwayThreshold?: number;
}

export interface MonteCarloResult {
  iterations: number;
  revenue: Percentiles;
  profit: Percentiles;
  runway: Percentiles;
  /** P(runway < threshold) — probability of breaching the cash safety line. */
  probRunwayBreach: number;
  runwayThreshold: number;
}

/**
 * Probabilistic SPBP forecast via Monte Carlo.
 *
 * Each trial: (1) sample a scenario from the (normalized) probability vector,
 * (2) draw revenue/profit/runway from a lognormal around that scenario's point
 * estimate (multiplicative noise keeps values non-negative and right-skewed,
 * which matches financial outcomes better than additive Gaussian).
 *
 * Output is a full distribution (P10/P50/P90 + mean) plus the probability of
 * breaching the runway safety line — i.e. a real probabilistic forecast rather
 * than a single weighted point estimate.
 */
export function monteCarloForecast(
  scenarios: Scenario[],
  opts: MonteCarloOptions = {},
): MonteCarloResult {
  const iterations = Math.max(1, opts.iterations ?? 10000);
  const cv = Math.max(0, opts.cv ?? 0.08);
  const threshold = opts.runwayThreshold ?? 3;
  const rng = mulberry32(opts.seed ?? 42);

  if (scenarios.length === 0) {
    const empty = summarize([0]);
    return {
      iterations: 0,
      revenue: empty,
      profit: empty,
      runway: empty,
      probRunwayBreach: 0,
      runwayThreshold: threshold,
    };
  }

  const probs = normalize(scenarios.map((s) => s.probability));
  const cum = cumulative(probs);

  const rev: number[] = new Array(iterations);
  const prof: number[] = new Array(iterations);
  const run: number[] = new Array(iterations);
  let breaches = 0;

  // Lognormal multiplier: exp(σ·Z − σ²/2) keeps the mean ≈ point estimate.
  const sigma = cv;
  const drift = (sigma * sigma) / 2;
  const lnMult = () => Math.exp(sigma * randNormal(rng) - drift);

  for (let t = 0; t < iterations; t++) {
    const sc = scenarios[pickIndex(cum, rng())];
    rev[t] = sc.fpaImpact.revenue * lnMult();
    prof[t] = sc.fpaImpact.profit * lnMult();
    const r = Math.max(0, sc.fpaImpact.runwayMonths * lnMult());
    run[t] = r;
    if (r < threshold) breaches++;
  }

  return {
    iterations,
    revenue: summarize(rev),
    profit: summarize(prof),
    runway: summarize(run),
    probRunwayBreach: breaches / iterations,
    runwayThreshold: threshold,
  };
}
