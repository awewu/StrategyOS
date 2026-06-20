import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildManagementReport } from "@/lib/fpa/management-report";
import { buildScrSummary, buildTopAlerts } from "./scr";

describe("panorama scr", () => {
  const deck = {
    source: "demo" as const,
    diagnosis: {
      id: "d",
      period: "2026-FY",
      challengeStatement: "从 1 亿到 2.5 亿",
      bottleneckType: "capability" as const,
      crux: "热泵产品化 12 个月",
      status: "approved" as const,
    },
    fpa: {
      revenueBudget: 6000,
      revenueActual: 5000,
      revenueForecast: 5800,
      profitBudget: 880,
      profitActual: 720,
      profitForecast: 820,
      cashRunwayMonths: 2.1,
    },
    managementReport: buildManagementReport({
      revenueBudget: 6000,
      revenueActual: 5000,
      revenueForecast: 5800,
      profitBudget: 880,
      profitActual: 720,
      profitForecast: 820,
      cashRunwayMonths: 2.1,
    }),
    capStack: {
      period: "2026-FY",
      capexBudget: 12000,
      capexActual: 9000,
      capexForecast: 9500,
      byHorizon: { H1: 62, H2: 28, H3: 10 },
      cashPeakMonth: "2026-09",
      cashPeakAmount: 3200,
      runwayAfterPeak: 2.8,
    },
    bscLights: {
      financial: "red" as const,
      customer: "green" as const,
      process: "yellow" as const,
      learning: "green" as const,
    },
    robustScore: {
      direction: 80,
      logic: 68,
      execution: 72,
      baseline: 70,
      doctrine: 85,
      learning: 58,
    },
    robustOverall: 72,
    assertions: [{ id: "a1", assertionType: "runway" as const, active: true, message: "runway 硬阻断" }],
    stratDiffs: [{ category: "FPA_FORECAST" as const, severity: "warning" as const, title: "FPA 偏差" }],
    spbpScenarios: [],
    investmentCases: [],
  };

  it("builds SCR with crux in resolution", () => {
    const scr = buildScrSummary(deck);
    assert.match(scr.resolution, /热泵产品化/);
    assert.ok(scr.complication.includes("Runway"));
  });

  it("caps top alerts at 3", () => {
    const alerts = buildTopAlerts(deck, 3);
    assert.ok(alerts.length <= 3);
    assert.ok(alerts.length >= 1);
  });

  it("builds implications and decisions from deck", () => {
    const { buildImplications, buildDecisionItems, buildIssueTree } = require("./scr");
    const implications = buildImplications(deck);
    assert.ok(implications.length >= 1);
    const decisions = buildDecisionItems(deck);
    assert.ok(decisions.some((d: { id: string }) => d.id === "dec-runway"));
    const tree = buildIssueTree(deck);
    assert.equal(tree.length, 3);
  });
});
