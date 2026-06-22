import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { compileStrategicText } from "./strategic-compiler";
import { sanitizeCompiledPayload } from "./import-quality";
import {
  buildImportDeductionReport,
  deduceOpsPulseDuplicates,
  simulateMergeImport,
} from "./import-deduction";

const DAY2_SNIPPET = `
五年战略解码总述
RheNEXT ：立足三十载积淀，开启行业新征程
O1: 核心品类达成-负向偏移度＜10% 20%
KR1: 客户满意度 - 提升至90%
`;

const DAY3_SNIPPET = `
O1: Ruud经销商开发，新增经销商8家，储备20家
O2: 区域销售达成（待改进点）
O3: 商用容积式品类达成4000万
`;

const DAY1_SNIPPET = `
发展3个业务合伙人
营销组织建设-高潜率50%
高效营销组织建设 - 高潜率50% 20%
`;

describe("import-deduction scenarios", () => {
  it("merge: Day3 on Day2 base adds unique OKRs + intent", () => {
    const base = compileStrategicText(DAY2_SNIPPET);
    const baseSan = sanitizeCompiledPayload(base);
    const existing = baseSan.accepted.map((a) => ({
      objective: a.objective.objective ?? "",
      keyResults: a.objective.keyResults.map((k) => k.keyResult),
    }));

    const incoming = compileStrategicText(DAY3_SNIPPET);
    const sanitized = sanitizeCompiledPayload(incoming, existing.flatMap((o) => [o.objective, ...o.keyResults]));
    const report = buildImportDeductionReport({
      mode: "merge",
      charCount: DAY3_SNIPPET.length,
      compiled: incoming,
      sanitized,
      existingObjectives: existing,
      planIntent: base.intent,
    });

    assert.ok(report.toAdd > 0);
    assert.equal(report.intentWouldUpdate, false);
    assert.ok(report.safeToImport);
  });

  it("merge: re-import Day3 → all duplicate, safe, no add", () => {
    const day3 = compileStrategicText(DAY3_SNIPPET);
    const san = sanitizeCompiledPayload(day3);
    assert.ok(san.stats.acceptedObjectives >= 2, "fixture should yield objectives");
    const existing = san.accepted.map((a) => ({
      objective: a.objective.objective ?? "",
      keyResults: a.objective.keyResults.map((k) => k.keyResult),
    }));

    const again = sanitizeCompiledPayload(day3, existing.flatMap((o) => [o.objective, ...o.keyResults]));
    const report = buildImportDeductionReport({
      mode: "merge",
      charCount: 100,
      compiled: day3,
      sanitized: again,
      existingObjectives: existing,
    });

    assert.equal(report.toAdd, 0);
    assert.equal(report.toMergeKr, 0);
    assert.ok(report.risks.some((r) => r.code === "ALL_DUPLICATE"));
    assert.ok(report.safeToImport);
  });

  it("merge: Day1 marketing OKR near-duplicates Day2", () => {
    const existing = [
      { objective: "高效营销组织建设 - 高潜率50% 20%", keyResults: [] as string[] },
    ];
    const incoming = compileStrategicText(DAY1_SNIPPET);
    const sanitized = sanitizeCompiledPayload(
      incoming,
      existing.map((e) => e.objective),
    );
    const dupes = sanitized.rejected.filter((r) => r.reason === "duplicate_existing");
    assert.ok(dupes.length >= 1);
  });

  it("replace mode warns overwrite", () => {
    const compiled = compileStrategicText("O1: 新目标\nKR1: 指标 50%");
    const sanitized = sanitizeCompiledPayload(compiled);
    const report = buildImportDeductionReport({
      mode: "replace",
      charCount: 50,
      compiled,
      sanitized,
      existingObjectives: [{ objective: "旧目标 A", keyResults: ["旧 KR"] }],
    });
    assert.ok(report.risks.some((r) => r.code === "REPLACE_OVERWRITE"));
  });

  it("empty extract blocks import", () => {
    const compiled = compileStrategicText("IN-CONFIDENCE\n-- 1 of 54 --");
    const sanitized = sanitizeCompiledPayload(compiled);
    const report = buildImportDeductionReport({
      mode: "merge",
      charCount: 30,
      compiled,
      sanitized,
      existingObjectives: [],
    });
    assert.equal(report.safeToImport, false);
    assert.ok(report.risks.some((r) => r.code === "EMPTY_EXTRACT"));
  });

  it("simulateMergeImport counts KR merge into existing objective", () => {
    const existing = [{ objective: "区域销售达成 50%", keyResults: ["KR-A"] }];
    const sanitized = sanitizeCompiledPayload({
      objectives: [
        {
          dimension: "PROCESS",
          objective: "区域销售达成 50%",
          keyResults: [{ keyResult: "新增渠道 3 个" }],
        },
      ],
      priorities: [],
      bscRows: [],
      summary: [],
    });
    const sim = simulateMergeImport(existing, sanitized);
    assert.equal(sim.toAdd, 0);
    assert.equal(sim.toMergeKr, 1);
  });

  it("Ops pulse triple submit detects duplicates", () => {
    const pulse = "§Pulse 本月一句话：酒店签约滞后\n§Pulse 偏离KR：KR-酒店\n";
    const result = deduceOpsPulseDuplicates([pulse, pulse, pulse.replace("滞后", "延迟")]);
    assert.equal(result.unique, 2);
    assert.equal(result.duplicateIndexes.length, 1);
  });
});
