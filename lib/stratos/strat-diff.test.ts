import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeStratDiff, computeDeliberateRealizationRate } from "./strat-diff";
import type { SnapshotStatePayload } from "../types/stratos";

const baseFrom: SnapshotStatePayload = {
  fpa: {
    revenueBudget: 6000,
    revenueActual: 5000,
    revenueForecast: 6200,
    profitBudget: 800,
    profitActual: 700,
    profitForecast: 780,
    cashRunwayMonths: 3.5,
  },
  investmentCases: [
    {
      id: "ic1",
      code: "IC-1",
      title: "Test",
      type: "brand",
      horizon: "H1",
      capexTotal: 100,
      gateStatus: "review",
      budgetTag: "IC-1",
      fpaToggle: "off",
    },
  ],
  projects: [{ id: "v6", code: "V6", name: "X", cynefinDomain: "complex", progressPercent: 0, status: "active", budgetTotal: 10, budgetSpent: 0, riskLevel: "low" }],
  strategyPattern: { deliberateRealizationRate: 78, emergentPatterns: [], unrealizedItems: [], serendipitousItems: [], learningPrompts: [] },
};

const baseTo: SnapshotStatePayload = {
  ...baseFrom,
  fpa: { ...baseFrom.fpa!, revenueForecast: 5400, cashRunwayMonths: 2.1 },
  investmentCases: [{ ...baseFrom.investmentCases![0], gateStatus: "approved" }],
  projects: [{ ...baseFrom.projects![0], progressPercent: 0 }],
  assumptions: [{ id: "h1", code: "H1", content: "x", cynefinDomain: "complex", result: "failed" }],
};

describe("computeStratDiff", () => {
  it("detects FPA forecast and runway crossing", () => {
    const diffs = computeStratDiff(baseFrom, baseTo);
    assert.ok(diffs.some((d) => d.category === "FPA_FORECAST"));
    assert.ok(diffs.some((d) => d.category === "CASH_RUNWAY"));
  });

  it("detects emergent from report patterns", () => {
    const diffs = computeStratDiff(baseFrom, baseTo, [
      {
        formationType: "emergent",
        title: "区县自发签约",
        linkedOkr: [],
        reportId: "r1",
      },
    ]);
    assert.ok(diffs.some((d) => d.category === "EMERGENT_PATTERN"));
  });

  it("computes deliberate rate drop", () => {
    const rate = computeDeliberateRealizationRate(baseFrom, baseTo);
    assert.ok(rate >= 0 && rate <= 100);
  });
});

describe("Mintzberg categories", () => {
  it("includes unrealized for stalled project", () => {
    const diffs = computeStratDiff(baseFrom, baseTo);
    assert.ok(diffs.some((d) => d.category === "UNREALIZED" || d.category === "DELIBERATE_RATE_DROP"));
  });
});
