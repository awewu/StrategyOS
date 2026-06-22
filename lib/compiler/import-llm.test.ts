import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseSemanticDedupePayload, refineWithSemanticDedupe, compilerLlmConfigured } from "./import-llm";
import { sanitizeCompiledPayload } from "./import-quality";

describe("import-llm", () => {
  it("parseSemanticDedupePayload maps duplicates and noise", () => {
    const incoming = ["营销组织建设高潜率50%", "全新渠道突破1000家", "IN-CONFIDENCE"];
    const existing = ["高效营销组织建设 - 高潜率50% 20%"];
    const raw = JSON.stringify({
      duplicates: [
        {
          incomingIndex: 0,
          existingIndex: 0,
          existingText: existing[0],
          confidence: 0.91,
          reason: "同义 OKR",
        },
      ],
      noise: [{ incomingIndex: 2, reason: "slide footer" }],
    });
    const pairs = parseSemanticDedupePayload(raw, incoming, existing);
    assert.equal(pairs[0]!.isDuplicate, true);
    assert.equal(pairs[1]!.isDuplicate, false);
    assert.equal(pairs[2]!.isNoise, true);
  });

  it("refineWithSemanticDedupe no-op when LLM not configured", async () => {
    const sanitized = sanitizeCompiledPayload({
      objectives: [{ dimension: "PROCESS", objective: "测试目标 A", keyResults: [] }],
      priorities: [],
      bscRows: [],
      summary: [],
    });
    const { sanitized: out, semantic } = await refineWithSemanticDedupe(sanitized, []);
    assert.ok(out.stats.acceptedObjectives >= 1);
    if (!compilerLlmConfigured()) {
      assert.equal(semantic.engine, "none");
    } else {
      assert.ok(["none", "llm"].includes(semantic.engine));
    }
  });
});
