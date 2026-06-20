import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runStratSimDynamics } from "./strat-sim-dynamics";
import { persistDiffsBetweenSnapshots } from "./persist-diff";
import { snapshotFY25, snapshotFY26 } from "../stratos-demo-data";

describe("strat-sim-dynamics", () => {
  it("runs stock/flow dynamics", () => {
    const trail = runStratSimDynamics(4);
    assert.equal(trail.length, 4);
    assert.ok(typeof trail[0].flows.rFlow === "number");
  });
});

describe("persist-diff", () => {
  it("computes diffs without DB", async () => {
    const r = await persistDiffsBetweenSnapshots("a", "b", snapshotFY25, snapshotFY26);
    assert.ok(r.count > 0);
  });
});
