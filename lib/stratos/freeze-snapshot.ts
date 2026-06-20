import type { SnapshotStatePayload } from "../types/stratos";
import {
  assertHealthBeforeSnapshot,
  runHealthAssertions,
  type AssertionContext,
} from "./health-assertions";
import { buildStrategyPattern } from "./strat-diff";

export interface FreezeSnapshotInput {
  period: string;
  snapshotType: "H1" | "FY" | "EVENT";
  code: string;
  state: SnapshotStatePayload;
  assertionCtx?: AssertionContext;
  meetingNotes?: string;
}

export interface FrozenSnapshotResult {
  code: string;
  period: string;
  frozenAt: string;
  stateJson: SnapshotStatePayload;
}

export function freezeSnapshot(input: FreezeSnapshotInput): FrozenSnapshotResult {
  const ctx = input.assertionCtx ?? { trigger: "PRE_SNAPSHOT" };
  const assertions = runHealthAssertions(ctx);
  const active = [
    ...(input.state.healthAssertions ?? []).filter((a) => a.active),
    ...assertions,
  ];
  assertHealthBeforeSnapshot(active);

  const pattern = buildStrategyPattern(input.state, input.state);
  const stateJson: SnapshotStatePayload = {
    ...input.state,
    healthAssertions: active,
    strategyPattern: pattern,
  };

  return {
    code: input.code,
    period: input.period,
    frozenAt: new Date().toISOString(),
    stateJson,
  };
}
