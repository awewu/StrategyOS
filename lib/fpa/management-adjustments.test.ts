import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseMarginBridgeJson, parseStatementsJson } from "./management-adjustments-access";
import { demoManagementReport } from "./management-report";

describe("management-adjustments-access", () => {
  it("parses valid margin bridge JSON", () => {
    const bridge = parseMarginBridgeJson(demoManagementReport.marginBridge);
    assert.equal(bridge.length, demoManagementReport.marginBridge.length);
  });

  it("parses valid statements JSON", () => {
    const statements = parseStatementsJson({
      incomeStatement: demoManagementReport.incomeStatement,
      balanceSheet: demoManagementReport.balanceSheet,
      cashFlowStatement: demoManagementReport.cashFlowStatement,
    });
    assert.equal(statements.incomeStatement.lines.length > 0, true);
  });

  it("rejects invalid margin bridge JSON", () => {
    assert.throws(() => parseMarginBridgeJson(null), /格式无效/);
  });
});
