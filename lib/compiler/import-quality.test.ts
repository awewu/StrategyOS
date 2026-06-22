import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  classifyObjectiveNoise,
  isNearDuplicate,
  normalizeForMatch,
  sanitizeCompiledPayload,
  textSimilarity,
} from "./import-quality";
import type { CompiledStrategicPayload } from "./strategic-compiler";

describe("import-quality", () => {
  it("normalizes titles for matching", () => {
    const a = normalizeForMatch("酒店渠道销售达成5000万 40%");
    const b = normalizeForMatch("酒店渠道销售达成5000万");
    assert.equal(a, b);
  });

  it("detects near duplicates", () => {
    assert.ok(isNearDuplicate("发展3个业务合伙人", "发展3个业务合伙人"));
    assert.ok(isNearDuplicate("RUUD业务模型打造-引进客户＞3家", "RUUD业务模型打造引进客户3家"));
  });

  it("rejects slide boilerplate and discussion prompts", () => {
    assert.equal(classifyObjectiveNoise("IN-CONFIDENCE"), "slide_boilerplate");
    assert.equal(classifyObjectiveNoise("先制造/财务 vs. 业务同步？"), "discussion_prompt");
    assert.equal(classifyObjectiveNoise("123"), "low_signal");
    assert.equal(classifyObjectiveNoise("---"), "too_short");
    assert.equal(classifyObjectiveNoise("------"), "low_signal");
  });

  it("accepts substantive Chinese OKR titles (not low_signal)", () => {
    assert.equal(classifyObjectiveNoise("区域销售达成（待改进点）"), null);
    assert.equal(classifyObjectiveNoise("江苏客户布局（待改进点）"), null);
    assert.equal(
      classifyObjectiveNoise("构建驱动业务增长的预算与资源体系，确保年度毛利目标绝对值达成"),
      null,
    );
    assert.equal(classifyObjectiveNoise("待改进点"), "low_signal");
  });

  it("dedupes within batch and against existing", () => {
    const payload: CompiledStrategicPayload = {
      objectives: [
        { dimension: "PROCESS", objective: "发展3个业务合伙人", keyResults: [] },
        { dimension: "PROCESS", objective: "发展3个业务合伙人", keyResults: [] },
        { dimension: "CUSTOMER", objective: "RUUD业务模型打造-引进客户＞3家", keyResults: [{ keyResult: "引进客户＞3家" }] },
      ],
      priorities: [],
      bscRows: [],
      summary: [],
    };
    const existing = ["区域销售达成（待改进点）"];
    const result = sanitizeCompiledPayload(payload, existing);
    assert.equal(result.stats.acceptedObjectives, 2);
    assert.ok(result.rejected.some((r) => r.reason === "duplicate_in_batch"));
  });

  it("filters low-signal KR-only duplicates of title", () => {
    const payload: CompiledStrategicPayload = {
      objectives: [
        {
          dimension: "FINANCIAL",
          objective: "年度毛利目标达成（绝对值达成） 30%",
          keyResults: [{ keyResult: "年度毛利目标达成（绝对值达成） 30%", target: "30%" }],
        },
      ],
      priorities: [],
      bscRows: [],
      summary: [],
    };
    const result = sanitizeCompiledPayload(payload);
    assert.equal(result.stats.acceptedObjectives, 1);
    assert.equal(result.stats.acceptedKeyResults, 0);
  });

  it("accepts short Chinese KPI fragments with OKR signal words", () => {
    assert.equal(classifyObjectiveNoise("渠道拓展"), null);
    assert.equal(classifyObjectiveNoise("区域销售"), null);
    assert.equal(classifyObjectiveNoise("渠道拓展(设计师/行业/系统集成商)，"), null);
    assert.equal(classifyObjectiveNoise("打造一支专业、高效的酒店渠道销售团"), null);
  });

  it("similarity scores substring overlap", () => {
    assert.ok(textSimilarity("商用容积式品类达成4000万", "商用容积式品类达成4000万 40%") >= 0.9);
  });
});
