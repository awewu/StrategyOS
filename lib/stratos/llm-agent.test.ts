import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseReportSmart } from "./llm-agent";

describe("llm-agent", () => {
  it("falls back to rules when LLM not configured", async () => {
    const raw = `§8 涌现：区县经销商自发组团签约\n现金 runway 2.1 月`;
    const { parsed, engine } = await parseReportSmart("rpt-test", raw, "2026-05", false);
    assert.equal(engine, "rules");
    assert.ok(parsed.patterns.length > 0);
  });
});
