import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  axisScore,
  buildPositioning,
  buildSwot,
  DEFAULT_AXES,
  dimensionStrength,
  generateTows,
  internalSwotFromPremises,
  parseSwotResponse,
  relevanceToScale,
  type PremiseLike,
  type SwotItem,
} from "./swot";
import type { IntelSignal } from "./types";

function sig(partial: Partial<IntelSignal>): IntelSignal {
  return {
    id: partial.id ?? "s1",
    competitor: partial.competitor ?? "史密斯",
    dimension: partial.dimension ?? "product",
    title: partial.title ?? "新品发布",
    summary: partial.summary ?? "摘要",
    impact: partial.impact ?? "threat",
    relevance: partial.relevance ?? 80,
    sourceKind: partial.sourceKind ?? "official_site",
    sourceLabel: partial.sourceLabel ?? "官网",
    capturedAt: partial.capturedAt ?? "2026-06-20",
    evidence: partial.evidence,
    verdict: partial.verdict,
  };
}

describe("relevanceToScale", () => {
  it("maps 0..100 onto 1..5 clamped", () => {
    assert.equal(relevanceToScale(0), 1);
    assert.equal(relevanceToScale(92), 5);
    assert.equal(relevanceToScale(50), 3);
    assert.equal(relevanceToScale(999), 5);
  });
});

describe("buildSwot", () => {
  it("threat signal → T, opportunity signal → O, neutral skipped", () => {
    const board = buildSwot([
      sig({ id: "a", impact: "threat", title: "热泵新品" }),
      sig({ id: "b", impact: "opportunity", title: "整装空当" }),
      sig({ id: "c", impact: "neutral", title: "代言人" }),
    ]);
    assert.equal(board.threat.length, 1);
    assert.equal(board.opportunity.length, 1);
    assert.equal(board.strength.length, 0);
    assert.equal(board.weakness.length, 0);
    assert.equal(board.threat[0].source, "a");
  });

  it("merges internal S/W and sorts by weight×intensity", () => {
    const internal: SwotItem[] = [
      { id: "s1", category: "strength", title: "渠道关系", weight: 5, intensity: 4 },
      { id: "w1", category: "weakness", title: "热泵产品化滞后", weight: 4, intensity: 4 },
    ];
    const board = buildSwot(
      [
        sig({ id: "lo", impact: "threat", relevance: 40, title: "弱威胁" }),
        sig({ id: "hi", impact: "threat", relevance: 95, title: "强威胁" }),
      ],
      internal,
    );
    assert.equal(board.strength.length, 1);
    assert.equal(board.weakness.length, 1);
    assert.equal(board.threat[0].source, "hi");
  });
});

describe("dimensionStrength / axisScore", () => {
  it("returns null for a blind-spot dimension", () => {
    assert.equal(dimensionStrength([sig({ dimension: "product" })], "gtm"), null);
  });

  it("threat scores higher than opportunity for same relevance", () => {
    const t = dimensionStrength([sig({ dimension: "product", impact: "threat", relevance: 80 })], "product");
    const o = dimensionStrength([sig({ dimension: "product", impact: "opportunity", relevance: 80 })], "product");
    assert.ok(t !== null && o !== null && t > o);
  });

  it("axisScore averages only covered dims", () => {
    const r = axisScore(
      [sig({ dimension: "product", impact: "threat", relevance: 80 })],
      DEFAULT_AXES.x, // product + strategy
    );
    assert.ok(r.score !== null);
    assert.equal(r.covered, 0.5); // only product covered of {product,strategy}
  });
});

describe("buildPositioning (十字坐标轴)", () => {
  const signals = [
    sig({ competitor: "史密斯", dimension: "product", impact: "threat", relevance: 92 }),
    sig({ competitor: "史密斯", dimension: "gtm", impact: "threat", relevance: 88 }),
    sig({ competitor: "海尔", dimension: "product", impact: "opportunity", relevance: 61 }),
  ];

  it("plots every competitor plus us", () => {
    const map = buildPositioning(signals, {}, { selfLabel: "我方" });
    const names = map.entities.map((e) => e.entity).sort();
    assert.deepEqual(names, ["史密斯", "我方", "海尔"].sort());
    assert.equal(map.entities.filter((e) => e.isUs).length, 1);
  });

  it("strong threats put a competitor in a high quadrant; us defaults to midline", () => {
    const map = buildPositioning(signals, { 史密斯: "up" }, {});
    const smith = map.entities.find((e) => e.entity === "史密斯")!;
    const us = map.entities.find((e) => e.isUs)!;
    assert.ok(smith.x > 50); // strong product/strategy threats
    assert.equal(us.x, 50); // no selfScores → 50 baseline
    assert.equal(us.y, 50);
  });

  it("self scores drive our coordinates and quadrant", () => {
    const map = buildPositioning(signals, {}, {
      selfScores: { product: 80, strategy: 70, gtm: 30, brand: 20 },
    });
    const us = map.entities.find((e) => e.isUs)!;
    assert.equal(us.x, 75); // (80+70)/2
    assert.equal(us.y, 25); // (30+20)/2
    assert.equal(us.quadrant, "product_led");
  });

  it("blind-spot competitor gets low confidence", () => {
    const map = buildPositioning(
      [sig({ competitor: "美的", dimension: "product", impact: "threat" })],
      {},
      {},
    );
    const midea = map.entities.find((e) => e.entity === "美的")!;
    assert.ok(midea.confidence < 0.5); // only 1 of 4 dims covered
  });
});

describe("generateTows", () => {
  it("produces SO/WO/ST/WT when board has all four corners", () => {
    const board = buildSwot(
      [
        sig({ id: "o", impact: "opportunity", title: "整装渠道空当", relevance: 70 }),
        sig({ id: "t", impact: "threat", title: "史密斯热泵", relevance: 90 }),
      ],
      [
        { id: "s", category: "strength", title: "渠道网络", weight: 5, intensity: 4 },
        { id: "w", category: "weakness", title: "热泵滞后", weight: 4, intensity: 4 },
      ],
    );
    const tows = generateTows(board);
    assert.equal(tows.SO.length, 1);
    assert.equal(tows.WO.length, 1);
    assert.equal(tows.ST.length, 1);
    assert.equal(tows.WT.length, 1);
    assert.ok(tows.SO[0].links.includes("/decode"));
  });
});

describe("internalSwotFromPremises", () => {
  const premises: PremiseLike[] = [
    { code: "P-strong", premise: "渠道飞轮成立", confidence: 80, fragility: 40 },
    { code: "P-weak-fail", premise: "资本充足", confidence: 30, fragility: 95, failSignal: "runway 2.1月" },
    { code: "P-weak-conf", premise: "不打价格战", confidence: 45, fragility: 85 },
    { code: "P-neutral", premise: "供应链稳定", confidence: 60, fragility: 65 },
  ];

  it("high confidence + low fragility → strength", () => {
    const items = internalSwotFromPremises(premises);
    const s = items.find((i) => i.id === "swot-premise-P-strong");
    assert.ok(s);
    assert.equal(s!.category, "strength");
  });

  it("failSignal or low confidence/high fragility → weakness, includes failSignal text", () => {
    const items = internalSwotFromPremises(premises);
    const w = items.find((i) => i.id === "swot-premise-P-weak-fail");
    assert.ok(w);
    assert.equal(w!.category, "weakness");
    assert.ok(w!.title.includes("runway 2.1月"));
  });

  it("ambiguous premise is skipped", () => {
    const items = internalSwotFromPremises(premises);
    assert.equal(items.find((i) => i.id === "swot-premise-P-neutral"), undefined);
  });

  it("feeds buildSwot as internal S/W", () => {
    const internal = internalSwotFromPremises(premises);
    const board = buildSwot([], internal);
    assert.ok(board.strength.length >= 1);
    assert.ok(board.weakness.length >= 2);
  });
});

describe("parseSwotResponse", () => {
  it("parses a valid TOWS JSON", () => {
    const out = parseSwotResponse(
      JSON.stringify({ SO: [{ title: "进攻整装", rationale: "用渠道", links: ["/decode"] }] }),
    );
    assert.ok(out);
    assert.equal(out!.SO.length, 1);
    assert.equal(out!.SO[0].type, "SO");
  });

  it("returns null on garbage", () => {
    assert.equal(parseSwotResponse("not json"), null);
    assert.equal(parseSwotResponse(JSON.stringify({ SO: [] })), null);
  });
});
