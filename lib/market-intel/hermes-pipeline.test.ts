import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  curateSignals,
  dimensionCoverage,
  gradeSignal,
  quoteCoverage,
} from "./hermes-pipeline";
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

const SOURCE = "史密斯发布AI净恒温热泵两联供新品，定位高端，瞄准南方采暖热水一体场景，月销4000台。";

describe("hermes QC grounding", () => {
  it("quoteCoverage = 1 for verbatim substring", () => {
    assert.equal(quoteCoverage("定位高端", SOURCE), 1);
  });

  it("quoteCoverage = 0 for absent quote", () => {
    assert.equal(quoteCoverage("库克在发布会演讲", SOURCE), 0);
  });

  it("supported when evidence is verbatim", () => {
    assert.equal(gradeSignal(sig({ evidence: "月销4000台" }), SOURCE), "supported");
  });

  it("unsupported when no evidence quote", () => {
    assert.equal(gradeSignal(sig({ evidence: undefined }), SOURCE), "unsupported");
  });

  it("unsupported when evidence is fabricated (not in source)", () => {
    assert.equal(
      gradeSignal(sig({ evidence: "史密斯收购开利全部股份完成交割" }), SOURCE),
      "unsupported",
    );
  });

  it("curator drops unsupported and keeps grounded, transparently", () => {
    const batch = curateSignals(
      "史密斯",
      [
        sig({ id: "ok", title: "AI热泵新品", evidence: "AI净恒温热泵两联供新品" }),
        sig({ id: "bad", title: "虚构并购", evidence: "完成对开利的全资收购" }),
      ],
      SOURCE,
    );
    assert.equal(batch.kept.length, 1);
    assert.equal(batch.kept[0].id, "ok");
    assert.equal(batch.kept[0].verdict, "supported");
    assert.equal(batch.drops.length, 1);
    assert.equal(batch.drops[0].title, "虚构并购");
    assert.ok(batch.drops[0].reason.length > 0);
  });

  it("dimensionCoverage reflects breadth across 4 dims", () => {
    assert.equal(dimensionCoverage([sig({ dimension: "product" })]), 0.25);
    assert.equal(
      dimensionCoverage([
        sig({ dimension: "product" }),
        sig({ dimension: "gtm" }),
        sig({ dimension: "brand" }),
        sig({ dimension: "strategy" }),
      ]),
      1,
    );
  });
});
