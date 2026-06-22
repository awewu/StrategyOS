import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_ELASTICITIES,
  priceCutImpact,
  segmentBeatImpact,
  v4DelayImpact,
} from "./driver-model";
import type { FpaSummary } from "@/lib/types/stratos";

const fpa: FpaSummary = {
  revenueBudget: 6000,
  revenueActual: 5120,
  revenueForecast: 5800,
  profitBudget: 880,
  profitActual: 720,
  profitForecast: 820,
  cashRunwayMonths: 2.1,
};

describe("driver-model", () => {
  it("v4 delay scales with quarters and is negative", () => {
    const q1 = v4DelayImpact(fpa, 1);
    const q2 = v4DelayImpact(fpa, 2);
    assert.ok(q1.revenueDeltaM < 0);
    assert.ok(q2.revenueDeltaM < q1.revenueDeltaM); // more delay → larger loss
    assert.ok(approxRatio(q2.revenueDeltaM, q1.revenueDeltaM * 2));
  });

  it("v4 delay is anchored to the actual revenue forecast", () => {
    const bigger = v4DelayImpact({ ...fpa, revenueForecast: 11600 }, 2);
    const base = v4DelayImpact(fpa, 2);
    // doubling the forecast doubles the impact (data-anchored, not constant)
    assert.ok(approxRatio(bigger.revenueDeltaM, base.revenueDeltaM * 2));
  });

  it("segment beat is positive and respects the cap", () => {
    const beat = segmentBeatImpact(fpa, 0.2);
    assert.ok(beat.revenueDeltaM > 0);
    const capped = segmentBeatImpact(fpa, 5);
    const atCap = segmentBeatImpact(fpa, 0.5);
    assert.equal(capped.revenueDeltaM, atCap.revenueDeltaM);
  });

  it("price cut hits revenue and profit, lowers runway", () => {
    const cut = priceCutImpact(fpa, 0.1);
    assert.ok(cut.revenueDeltaM < 0);
    assert.ok(cut.profitDeltaM < 0);
    assert.ok(cut.runwayDeltaMonths < 0);
  });

  it("elasticities are override-able for calibration", () => {
    const custom = { ...DEFAULT_ELASTICITIES, v4RevenueSharePerQuarter: 0.05 };
    const base = v4DelayImpact(fpa, 1);
    const tuned = v4DelayImpact(fpa, 1, custom);
    assert.ok(Math.abs(tuned.revenueDeltaM) > Math.abs(base.revenueDeltaM));
  });
});

function approxRatio(a: number, b: number, tol = 0.02): boolean {
  if (b === 0) return Math.abs(a) < 1;
  return Math.abs((a - b) / b) < tol;
}
