import type { Scenario } from "@/lib/types/stratos";
import { bayesianPosterior, toIntegerPercents } from "./bayes";

export interface SpbpEvidence {
  favorsOptimistic?: boolean;
  favorsPessimistic?: boolean;
  /** Evidence strength 0–1; mapped to a likelihood ratio exp(strength). */
  strength?: number;
}

/**
 * Map evidence to a per-scenario likelihood P(E|scenario).
 *
 * The likelihood ratio is exp(strength): strength 0 → ratio 1 (uninformative,
 * prior unchanged); strength 0.2 → ~1.22× more likely under the favored
 * direction and the reciprocal under the opposed direction. This is a proper
 * likelihood, so the update below is genuine Bayes, not an additive nudge.
 */
function likelihoodFor(name: string, ev: SpbpEvidence): number {
  const lr = Math.exp(ev.strength ?? 0.15);
  const isOpt = name.includes("乐观");
  const isPess = name.includes("悲观");

  if (ev.favorsPessimistic) {
    if (isPess) return lr;
    if (isOpt) return 1 / lr;
  }
  if (ev.favorsOptimistic) {
    if (isOpt) return lr;
    if (isPess) return 1 / lr;
  }
  return 1;
}

/**
 * Bayesian update of scenario probabilities: posterior ∝ prior × likelihood.
 * Returns scenarios with integer percent probabilities summing to exactly 100.
 */
export function updateScenarioProbabilities(
  scenarios: Scenario[],
  evidence: SpbpEvidence
): Scenario[] {
  if (scenarios.length === 0) return scenarios;
  const priors = scenarios.map((s) => s.probability);
  const likelihoods = scenarios.map((s) => likelihoodFor(s.name, evidence));
  const posterior = bayesianPosterior(priors, likelihoods);
  const percents = toIntegerPercents(posterior);
  return scenarios.map((s, i) => ({ ...s, probability: percents[i] }));
}

export function weightedRunway(scenarios: Scenario[]): number {
  const total = scenarios.reduce((a, s) => a + s.probability, 0) || 1;
  return scenarios.reduce((a, s) => a + s.fpaImpact.runwayMonths * (s.probability / total), 0);
}
