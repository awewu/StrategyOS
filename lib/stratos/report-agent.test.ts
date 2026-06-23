import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseReportContent } from "./report-agent";

describe("report-agent Chinese signals", () => {
  it("extracts coverage, runway assertion, and Mintzberg pattern from normal Chinese text", () => {
    const raw = [
      "§8 战略模式：区县经销商自发组团签约，建议下版 deliberate 候选",
      "覆盖：酒店签约 820/1200，Q2 华东新签 62/80，偏离 KR",
      "现金 runway 2.1 月，9 月波峰 3200 万",
    ].join("\n");

    const result = parseReportContent("rpt-cn", raw, "2026-06");

    assert.equal(result.status, "parsed");
    assert.ok(result.coverageUpdates.some((line) => line.includes("820/1200")));
    assert.ok(result.assertionTriggers.some((line) => line.includes("runway")));
    assert.ok(result.patterns.some((pattern) => pattern.formationType === "emergent"));
  });
});
