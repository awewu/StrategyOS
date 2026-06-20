import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildManagementReport,
  computeEbitdaMargin,
  computeRos,
  demoManagementReport,
} from "./management-report";

describe("management-report", () => {
  it("computes ROS as net income / revenue", () => {
    assert.equal(computeRos(580, 5120), 580 / 5120);
    assert.equal(computeRos(0, 5120), 0);
    assert.equal(computeRos(100, 0), 0);
  });

  it("computes EBITDA margin", () => {
    assert.equal(computeEbitdaMargin(886, 5120), 886 / 5120);
  });

  it("builds three statements from FPA summary", () => {
    const report = buildManagementReport({
      revenueBudget: 6000,
      revenueActual: 5120,
      revenueForecast: 5800,
      profitBudget: 880,
      profitActual: 720,
      profitForecast: 820,
      cashRunwayMonths: 2.1,
    });

    assert.equal(report.incomeStatement.lines.length >= 10, true);
    assert.equal(report.balanceSheet.assets.length >= 4, true);
    assert.equal(report.cashFlowStatement.lines.length >= 8, true);
    assert.ok(report.kpis.rosActual > 0 && report.kpis.rosActual < 1);
    assert.ok(report.kpis.ebitdaActual > report.kpis.ebitdaActual * 0);
    assert.equal(report.kpis.ebitdaMarginActual, report.kpis.ebitdaActual / 5120);
  });

  it("margin bridge ends at net income", () => {
    const net = demoManagementReport.incomeStatement.lines.find((l) => l.key === "net")!;
    const last = demoManagementReport.marginBridge.at(-1)!;
    assert.equal(last.cumulative, net.actual);
  });

  it("balance sheet balances", () => {
    const { assets, liabilities, equity } = demoManagementReport.balanceSheet;
    const totalA = assets.find((l) => l.key === "total_assets")!.actual;
    const totalL = liabilities.find((l) => l.key === "total_liab")!.actual;
    const totalE = equity.find((l) => l.key === "total_equity")!.actual;
    assert.equal(totalA, totalL + totalE);
  });
});
