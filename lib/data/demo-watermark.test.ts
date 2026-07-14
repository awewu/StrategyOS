import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEMO_WATERMARK_PROBES,
  deriveDemoFallbacks,
  watermarkSignal,
} from "./demo-watermark";

describe("demo 水位标记", () => {
  it("全部有数据 → 无回退", () => {
    const counts = Object.fromEntries(DEMO_WATERMARK_PROBES.map((p) => [p.key, 1]));
    assert.deepEqual(deriveDemoFallbacks(counts), []);
  });

  it("零行实体被标出（含缺失 key 视同 0）", () => {
    const counts = Object.fromEntries(DEMO_WATERMARK_PROBES.map((p) => [p.key, 5]));
    counts.productBets = 0;
    delete counts.jtbdCards;
    const out = deriveDemoFallbacks(counts);
    assert.deepEqual(out, ["产品赌注", "JTBD 卡"]);
  });

  it("水位信号:0 绿 · 1–3 黄 · ≥4 红", () => {
    assert.equal(watermarkSignal(0), "green");
    assert.equal(watermarkSignal(1), "yellow");
    assert.equal(watermarkSignal(3), "yellow");
    assert.equal(watermarkSignal(4), "red");
  });
});
