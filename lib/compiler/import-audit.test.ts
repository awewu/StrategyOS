import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildFilterAuditReport } from "./import-audit";
import { compileStrategicText } from "./strategic-compiler";
import { sanitizeCompiledPayload } from "./import-quality";

const DAY3_SNIPPET = `
O1: Ruud经销商开发，新增经销商8家，储备20家
O2: 区域销售达成（待改进点）
O3: 商用容积式品类达成4000万
`;

const NOISE_SNIPPET = `
IN-CONFIDENCE
-- 1 of 54 --
先制造/财务 vs. 业务同步？
123
`;

describe("import-audit", () => {
  it("buildFilterAuditReport counts accepted and rejected", () => {
    const report = buildFilterAuditReport({ rawText: DAY3_SNIPPET, fileName: "day3.txt" });
    assert.ok(report.rawObjectives >= 2);
    assert.equal(report.accepted + report.rejected, report.rawObjectives);
    assert.ok(report.charCount > 0);
    assert.ok(report.prefilterChars > 0);
    assert.ok(report.summary.length >= 2);
  });

  it("buildFilterAuditReport breaks down byReason", () => {
    const report = buildFilterAuditReport({ rawText: NOISE_SNIPPET, fileName: "noise.txt" });
    const totalByReason = Object.values(report.byReason).reduce((a, b) => a + (b ?? 0), 0);
    assert.equal(totalByReason, report.rejected);
    assert.ok(report.reasonLabels.slide_boilerplate);
    assert.ok(report.reasonLabels.discussion_prompt);
  });

  it("buildFilterAuditReport does not flag 待改进点 titles as review candidates", () => {
    const report = buildFilterAuditReport({ rawText: DAY3_SNIPPET, fileName: "day3.txt" });
    const daiGaijin = report.reviewCandidates.filter((c) => c.text.includes("待改进点"));
    assert.equal(daiGaijin.length, 0);
    assert.ok(report.acceptedSamples.some((s) => s.includes("待改进点")));
  });

  it("buildFilterAuditReport accepts long Chinese budget OKR title", () => {
    const text = "O1: 构建驱动业务增长的预算与资源体系，确保年度毛利目标绝对值达成";
    const report = buildFilterAuditReport({ rawText: text });
    assert.equal(report.rejectedItems.filter((r) => r.reason === "low_signal").length, 0);
    assert.ok(report.accepted >= 1);
  });

  it("buildFilterAuditReport flags review candidates for long low_signal", () => {
    const longLowSignal = "O1: 这是一个足够长的低信号标题用于复核测试";
    const compiled = compileStrategicText(longLowSignal);
    const sanitized = sanitizeCompiledPayload(compiled);
    const report = buildFilterAuditReport({
      rawText: longLowSignal,
      sanitized,
    });
    const lowSignalRejects = report.rejectedItems.filter((r) => r.reason === "low_signal");
    if (lowSignalRejects.some((r) => r.text.length >= 12)) {
      assert.ok(report.reviewCandidates.length >= 1);
      assert.ok(report.reviewCandidates[0]!.reviewHint.includes("低信号"));
    }
  });

  it("buildFilterAuditReport detects duplicate_existing with 待改进点 hint", () => {
    const report = buildFilterAuditReport({
      rawText: DAY3_SNIPPET,
      existingTitles: ["区域销售达成（待改进点）", "商用容积式品类达成4000万"],
    });
    const dupExisting = report.rejectedItems.filter((r) => r.reason === "duplicate_existing");
    if (dupExisting.some((r) => r.text.includes("待改进点"))) {
      assert.equal(
        report.reviewCandidates.filter((c) => c.text.includes("待改进点")).length,
        0,
      );
    }
  });

  it("buildFilterAuditReport includes acceptedSamples", () => {
    const report = buildFilterAuditReport({ rawText: DAY3_SNIPPET });
    if (report.accepted > 0) {
      assert.ok(report.acceptedSamples.length > 0);
      assert.ok(report.acceptedSamples.every((s) => s.length > 0));
    }
  });
});
