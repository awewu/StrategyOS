import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { bridgeBarStyle } from "./bridge-bar-style";
import { demoManagementReport } from "./management-report";

describe("bridge-bar-style", () => {
  it("assigns negative bridge items to negative token", () => {
    const cogs = demoManagementReport.marginBridge.find((i) => i.label.includes("营业成本"))!;
    assert.equal(bridgeBarStyle(cogs), "var(--chart-bridge-negative)");
  });

  it("assigns positive bridge items to positive token", () => {
    const rev = demoManagementReport.marginBridge[0]!;
    assert.equal(bridgeBarStyle(rev), "var(--chart-bridge-positive)");
  });

  it("assigns total row to total token", () => {
    const total = demoManagementReport.marginBridge.at(-1)!;
    assert.equal(bridgeBarStyle(total), "var(--chart-bridge-total)");
  });
});
