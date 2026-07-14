import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { objectiveProgress, parseTtiNumber, ttiScore, ttiTone } from "./okr";

describe("TTI scoring", () => {
  it("parses numbers with cn units and separators", () => {
    assert.equal(parseTtiNumber("1,200 万"), 1200);
    assert.equal(parseTtiNumber("50%"), 50);
    assert.equal(parseTtiNumber("50 家"), 50);
    assert.equal(parseTtiNumber(""), null);
    assert.equal(parseTtiNumber("N/A"), null);
  });

  it("scores improvement from baseline, not absolute state", () => {
    // 35% → 50%, currently 44% : (44-35)/(50-35) = 0.6
    const s = ttiScore("35", "50", "44");
    assert.equal(s.numeric, true);
    assert.ok(Math.abs((s.progress ?? 0) - 0.6) < 1e-9);
  });

  it("missing baseline defaults to 0 (从无到有)", () => {
    const s = ttiScore(null, "50", "25");
    assert.equal(s.progress, 0.5);
  });

  it("regression direction works (降本 100 → 80)", () => {
    const s = ttiScore("100", "80", "90");
    assert.equal(s.progress, 0.5);
  });

  it("unscorable when target missing or equals baseline", () => {
    assert.equal(ttiScore("10", "10", "10").progress, null);
    assert.equal(ttiScore("10", null, "12").progress, null);
  });

  it("tension convention: 0.7 is success", () => {
    assert.equal(ttiTone(0.75), "green");
    assert.equal(ttiTone(0.5), "yellow");
    assert.equal(ttiTone(0.2), "red");
    assert.equal(ttiTone(null), "neutral");
  });

  it("objective progress averages scorable KRs, caps at 1", () => {
    const p = objectiveProgress({
      keyResults: [
        { baselineValue: "0", targetValue: "100", currentValue: "120" }, // capped 1
        { baselineValue: "0", targetValue: "100", currentValue: "50" }, // 0.5
        { baselineValue: null, targetValue: null, currentValue: null }, // excluded
      ].map((kr) => ({
        id: "x",
        title: "x",
        unit: null,
        confidence: null,
        isLeadingIndicator: true,
        commitmentCount: 0,
        ...kr,
      })),
    });
    assert.equal(p, 0.75);
  });
});
