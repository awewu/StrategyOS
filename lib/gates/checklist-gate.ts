/**
 * Shared checklist-gate kernel — verdict resolution for clearance gates.
 *
 * Both the innovation Stage-Gate (`lib/innovation/engine.ts`) and the M&A
 * deal gate (`lib/ma/engine.ts`) are isomorphic checklist gates: domain code
 * collects hard blockers and pending items, this kernel resolves the
 * three-state verdict. Domain-specific checks/messages stay in each engine.
 *
 * Semantics:
 * - strict (default): any hard blocker → kill; pending only → hold; else go.
 * - non-strict: hard or pending → hold (never auto-kill); else go.
 */

export type ChecklistVerdict = "go" | "hold" | "kill";

export interface ChecklistGateResolution {
  verdict: ChecklistVerdict;
  /** hard blockers first, then pending items */
  blockers: string[];
}

export function resolveChecklistGate(
  hard: string[],
  pending: string[],
  opts: { strict?: boolean } = {},
): ChecklistGateResolution {
  const strict = opts.strict ?? true;
  let verdict: ChecklistVerdict;
  if (strict && hard.length > 0) verdict = "kill";
  else if (hard.length > 0 || pending.length > 0) verdict = "hold";
  else verdict = "go";
  return { verdict, blockers: [...hard, ...pending] };
}
