import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildParseMeta, getReportParseStatus } from "./parse-status";

describe("parse-status", () => {
  it("derives signal status from parsed report payload", () => {
    const parsed = {
      coverageUpdates: ["覆盖 820/1200"],
      assertionTriggers: ["runway 2.1 月 < 3 月阈值"],
      patterns: [{ formationType: "emergent", title: "区县经销商自发组团签约" }],
    };

    const meta = buildParseMeta({ parsed, engine: "llm", textExtracted: true });
    const status = getReportParseStatus({ ...parsed, ...meta });

    assert.equal(status.hasParsed, true);
    assert.equal(status.engine, "llm");
    assert.equal(status.hasSignals, true);
    assert.equal(status.signalCount, 3);
    assert.equal(status.textExtracted, true);
  });

  it("preserves no-text parse warning", () => {
    const status = getReportParseStatus({
      engine: "rules",
      textExtracted: false,
      signalCount: 0,
      parseWarnings: ["未抽取到原始文本，解析仅使用标题或手工输入。"],
      coverageUpdates: [],
      assertionTriggers: [],
      patterns: [],
    });

    assert.equal(status.hasParsed, true);
    assert.equal(status.hasSignals, false);
    assert.equal(status.textExtracted, false);
    assert.equal(status.parseWarning, "未抽取到原始文本，解析仅使用标题或手工输入。");
  });
});
