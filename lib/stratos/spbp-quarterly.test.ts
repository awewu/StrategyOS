import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runSpbpQuarterlyUpdate } from "./spbp-quarterly";

describe("spbp-quarterly", () => {
  it("runs update with report evidence and returns scenarios summing to 100", async () => {
    const raw = "现金 runway 2.1 月\n覆盖：酒店签约 820/1200";
    const result = await runSpbpQuarterlyUpdate("rpt-q1", raw);

    assert.equal(result.updated, true);
    assert.ok(result.scenarios.length > 0);
    const total = result.scenarios.reduce((sum, s) => sum + s.probability, 0);
    assert.equal(total, 100, "Probabilities should sum to 100");

    assert.ok(result.evidence.favorsPessimistic, "Runway < 3 should favor pessimistic");
    assert.ok((result.evidence.strength ?? 0) > 0, "Should have positive evidence strength");
  });

  it("runs update without report content (neutral evidence)", async () => {
    const result = await runSpbpQuarterlyUpdate();

    assert.equal(result.updated, true);
    assert.ok(result.scenarios.length > 0);
    const total = result.scenarios.reduce((sum, s) => sum + s.probability, 0);
    assert.equal(total, 100);
    assert.equal(result.evidence.favorsPessimistic, false);
    assert.equal(result.evidence.favorsOptimistic, undefined);
  });

  it("derives stronger evidence from more assertion triggers", async () => {
    const weakRaw = "现金 runway 2.1 月";
    const strongRaw = "现金 runway 1.5 月\n合规违规重大事件\n安全生产事故";

    const weak = await runSpbpQuarterlyUpdate("rpt-weak", weakRaw);
    const strong = await runSpbpQuarterlyUpdate("rpt-strong", strongRaw);

    assert.ok(
      (strong.evidence.strength ?? 0) >= (weak.evidence.strength ?? 0),
      "More triggers should produce equal or stronger evidence"
    );
  });
});
