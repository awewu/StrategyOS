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

  it("revenue impact is monotonic in magnitude (driver-based)", () => {
    const q1 = runCounterfactual(snapshotFY26, { type: "v4_delay", magnitude: 1 });
    const q3 = runCounterfactual(snapshotFY26, { type: "v4_delay", magnitude: 3 });
    assert.ok(q3.metrics.revenueDeltaM < q1.metrics.revenueDeltaM);
    assert.ok(q3.metrics.runwayMonths <= q1.metrics.runwayMonths);
  });

  it("impact scales with the snapshot's actual forecast (data-anchored)", () => {
    const richer = {
      ...snapshotFY26,
      fpa: { ...snapshotFY26.fpa!, revenueForecast: snapshotFY26.fpa!.revenueForecast * 2 },
    };
    const base = runCounterfactual(snapshotFY26, { type: "v4_delay", magnitude: 2 });
    const scaled = runCounterfactual(richer, { type: "v4_delay", magnitude: 2 });
    assert.ok(Math.abs(scaled.metrics.revenueDeltaM) > Math.abs(base.metrics.revenueDeltaM) * 1.8);
  });

  it("price cut reduces profit and runway", () => {
    const r = runCounterfactual(snapshotFY26, { type: "price_cut", magnitude: 0.2 });
    assert.ok((r.metrics.profitDeltaM ?? 0) < 0);
    assert.ok(r.metrics.runwayMonths < snapshotFY26.fpa!.cashRunwayMonths);
  });
});
