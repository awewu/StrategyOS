import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runCounterfactual, COUNTERFACTUAL_PRESETS } from "./counterfactual";
import { snapshotFY26 } from "../stratos-demo-data";

describe("counterfactual", () => {
  it("v4 delay reduces revenue and runway", () => {
    const r = runCounterfactual(snapshotFY26, { type: "v4_delay", magnitude: 2 });
    assert.equal(r.metrics.revenueDeltaM, -400);
    assert.ok(r.metrics.runwayMonths < 3.5);
    assert.ok(r.linkedDiff.includes("ROADMAP_SLIP"));
  });

  it("hotel beat increases revenue", () => {
    const r = runCounterfactual(snapshotFY26, { type: "hotel_beat", magnitude: 0.2 });
    assert.equal(r.metrics.revenueDeltaM, 320);
    assert.ok(r.linkedDiff.includes("EMERGENT_PATTERN"));
  });

  it("presets are runnable", () => {
    for (const p of COUNTERFACTUAL_PRESETS) {
      const r = runCounterfactual(snapshotFY26, p);
      assert.ok(r.premise.length > 0);
    }
  });
});
