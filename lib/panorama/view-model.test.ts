import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildManagementReport } from "@/lib/fpa/management-report";
import { buildPanoramaViewModel, kpiValue } from "./view-model";

describe("panorama view-model", () => {
  it("builds from minimal deck shape", () => {
    const deck = {
      source: "demo" as const,
      diagnosis: {
        id: "d",
        period: "2026-FY",
        challengeStatement: "test",
        bottleneckType: "capability" as const,
        crux: "crux",
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
      assertions: [],
      stratDiffs: [{ category: "FPA_FORECAST" as const, severity: "warning" as const, title: "t" }],
      spbpScenarios: [],
      investmentCases: [],
      managementReport: buildManagementReport({
        revenueBudget: 6000,
        revenueActual: 5000,
        revenueForecast: 5800,
        profitBudget: 880,
        profitActual: 720,
        profitForecast: 820,
        cashRunwayMonths: 2.1,
      }),
    };
    const vm = buildPanoramaViewModel(deck);
    assert.equal(vm.period, "2026-FY");
    assert.match(kpiValue(vm, "runway"), /月/);
    assert.match(kpiValue(vm, "ros"), /%/);
  });
});
