export { syncBetFpaToggle, applyBetToggle, forecastAmount } from "./fpa-toggle";
export {
  runHealthAssertions,
  assertHealthBeforeSnapshot,
  mergeAssertions,
  SnapshotBlockedError,
} from "./health-assertions";
export {
  computeStratDiff,
  computeDeliberateRealizationRate,
  buildStrategyPattern,
  topDiffs,
} from "./strat-diff";
export { freezeSnapshot } from "./freeze-snapshot";
export {
  runCounterfactual,
  COUNTERFACTUAL_PRESETS,
  type CounterfactualInput,
  type CounterfactualResult,
  type CounterfactualType,
} from "./counterfactual";
