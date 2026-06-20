import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_SIM_PARAMS, runStratSim, simWarnings } from "./strat-sim";

describe("strat-sim", () => {
  it("runs 8 quarters by default", () => {
    const trail = runStratSim();
    assert.equal(trail.length, 8);
    assert.equal(trail[0].quarter, "2026-Q1");
  });

  it("price cut reduces profit vs baseline", () => {
    const base = runStratSim(8, { ...DEFAULT_SIM_PARAMS, priceCut: 0 });
    const cut = runStratSim(8, { ...DEFAULT_SIM_PARAMS, priceCut: 0.4 });
    assert.ok(cut[7].profit < base[7].profit);
  });

  it("warns on low runway", () => {
    const trail = runStratSim(8, {
      ...DEFAULT_SIM_PARAMS,
      priceCut: 0.45,
      balanceStrength: 0.9,
    });
    const warnings = simWarnings(trail);
    assert.ok(warnings.some((w) => w.includes("runway")));
  });
});
