import { test } from "node:test";
import assert from "node:assert/strict";
import { buildRobustView, weightedComposite } from "./robust-view";
import { twelveDimensions } from "./twelve-dimensions";

test("weightedComposite weights scores", () => {
  assert.equal(weightedComposite([{ score: 100, weight: 3 }, { score: 0, weight: 1 }]), 75);
  assert.equal(weightedComposite([]), 0);
});

test("buildRobustView surfaces all 12 dims with signals, no prior/target by default", () => {
  const v = buildRobustView({
    period: "2026-FY",
    priorPeriod: null,
    source: "demo",
    current: {},
    prior: null,
  });
  assert.equal(v.dims.length, 12);
  // Uses registry signals (not averaged away)
  assert.equal(v.dims.find((d) => d.id === "d12")?.signal, "red");
  assert.equal(v.dims.every((d) => d.prior === null && d.delta === null), true);
  assert.equal(v.dims.every((d) => d.target === null), true);
  assert.equal(v.overallPrior, null);
  assert.equal(v.overallDelta, null);
  assert.equal(v.targetsSet, 0);
});

test("buildRobustView computes period-over-period delta and target", () => {
  const v = buildRobustView({
    period: "2026-FY",
    priorPeriod: "2025-FY",
    source: "database",
    current: {
      d1: { score: 80, signal: "green", target: 85 },
      d9: { score: 60, signal: "red" },
    },
    prior: { d1: 70, d9: 65 },
  });
  const d1 = v.dims.find((d) => d.id === "d1")!;
  assert.equal(d1.score, 80);
  assert.equal(d1.prior, 70);
  assert.equal(d1.delta, 10);
  assert.equal(d1.target, 85);
  const d9 = v.dims.find((d) => d.id === "d9")!;
  assert.equal(d9.delta, -5);
  assert.equal(d9.target, null);
  assert.equal(v.targetsSet, 1);
  assert.equal(typeof v.overallDelta, "number");
});

test("buildRobustView overall matches registry weighting when using defaults", () => {
  const v = buildRobustView({
    period: "2026-FY",
    priorPeriod: null,
    source: "demo",
    current: {},
    prior: null,
  });
  const total = twelveDimensions.reduce((s, d) => s + d.score * d.weight, 0);
  const w = twelveDimensions.reduce((s, d) => s + d.weight, 0);
  assert.equal(v.overall, Math.round(total / w));
});
