import { buildManagementReport } from "@/lib/fpa/management-report";
import * as demo from "@/lib/stratos-demo-data";

/** Minimal CommandDeck stub for panorama unit tests */
export function minimalCommandDeckStub() {
  return {
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
      byBrand: {},
      byType: {},
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
    bscCards: demo.bscCards,
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
    decisions: [],
    derivedDecisions: [],
    decisionsSource: "derived" as const,
    timeline: [],
    derivedTimeline: [],
    timelineSource: "derived" as const,
  };
}
