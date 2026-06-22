import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { demoManagementReport } from "./management-report";
import { validateMarginBridge, validateStatementsOverride } from "./management-validate";

describe("management-validate", () => {
  it("accepts demo margin bridge", () => {
    assert.doesNotThrow(() => validateMarginBridge(demoManagementReport.marginBridge));
  });

  it("rejects margin bridge without total row", () => {
    assert.throws(
      () =>
        validateMarginBridge([
          { label: "营业收入", value: 100, cumulative: 100 },
        ]),
      /合计/,
    );
  });

  it("accepts balanced demo statements", () => {
    assert.doesNotThrow(() =>
      validateStatementsOverride({
        incomeStatement: demoManagementReport.incomeStatement,
        balanceSheet: demoManagementReport.balanceSheet,
        cashFlowStatement: demoManagementReport.cashFlowStatement,
      }),
    );
  });

  it("rejects unbalanced balance sheet", () => {
    const broken = structuredClone(demoManagementReport.balanceSheet);
    const totalAssets = broken.assets.find((l) => l.key === "total_assets")!;
    totalAssets.actual += 100;
    assert.throws(
      () =>
        validateStatementsOverride({
          incomeStatement: demoManagementReport.incomeStatement,
          balanceSheet: broken,
          cashFlowStatement: demoManagementReport.cashFlowStatement,
        }),
      /不平衡/,
    );
  });
});
