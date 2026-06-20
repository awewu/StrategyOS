import type { Scenario } from "@/lib/types/stratos";

/** Simple Bayesian-style probability nudge toward evidence-aligned scenarios */
export function updateScenarioProbabilities(
  scenarios: Scenario[],
  evidence: { favorsOptimistic?: boolean; favorsPessimistic?: boolean; strength?: number }
): Scenario[] {
  const strength = evidence.strength ?? 0.15;
  let next = scenarios.map((s) => ({ ...s, probability: s.probability }));

  if (evidence.favorsOptimistic) {
    next = nudge(next, "乐观", strength);
    next = nudge(next, "悲观", -strength);
  }
  if (evidence.favorsPessimistic) {
    next = nudge(next, "悲观", strength);
    next = nudge(next, "乐观", -strength);
  }

  return normalizeProbabilities(next);
}

function nudge(scenarios: Scenario[], name: string, deltaPct: number): Scenario[] {
  return scenarios.map((s) =>
    s.name === name
      ? { ...s, probability: Math.max(5, Math.min(80, s.probability + deltaPct * 100)) }
      : s
  );
}

function normalizeProbabilities(scenarios: Scenario[]): Scenario[] {
  const total = scenarios.reduce((a, s) => a + s.probability, 0);
  if (total === 0) return scenarios;
  return scenarios.map((s) => ({
    ...s,
    probability: Math.round((s.probability / total) * 100),
  }));
}

export function weightedRunway(scenarios: Scenario[]): number {
  return scenarios.reduce((a, s) => a + s.fpaImpact.runwayMonths * (s.probability / 100), 0);
}
