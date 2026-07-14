import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveChecklistGate } from "./checklist-gate";

describe("resolveChecklistGate", () => {
  it("returns go when no blockers", () => {
    const r = resolveChecklistGate([], []);
    assert.equal(r.verdict, "go");
    assert.deepEqual(r.blockers, []);
  });

  it("strict: hard blocker → kill", () => {
    const r = resolveChecklistGate(["证据不足"], []);
    assert.equal(r.verdict, "kill");
    assert.deepEqual(r.blockers, ["证据不足"]);
  });

  it("strict: pending only → hold", () => {
    const r = resolveChecklistGate([], ["杀手假设待证伪:K1"]);
    assert.equal(r.verdict, "hold");
    assert.deepEqual(r.blockers, ["杀手假设待证伪:K1"]);
  });

  it("non-strict: hard blocker → hold, not kill", () => {
    const r = resolveChecklistGate(["ROIC 未达 WACC 门槛"], [], { strict: false });
    assert.equal(r.verdict, "hold");
  });

  it("non-strict: hard + pending → hold with ordered blockers", () => {
    const r = resolveChecklistGate(["h1"], ["p1"], { strict: false });
    assert.equal(r.verdict, "hold");
    assert.deepEqual(r.blockers, ["h1", "p1"]);
  });
});
