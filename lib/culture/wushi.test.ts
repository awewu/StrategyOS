import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildWushiRiskList,
  defaultWushiAssessment,
  deriveQijiVerdicts,
  internalFactors,
  qijiTally,
  wushiReadiness,
  type WushiAssessment,
} from "./wushi";
import { demoSelfScores, demoSignals, demoTracks } from "../market-intel/demo-data";

describe("defaultWushiAssessment", () => {
  it("has 5 factors and 7 qiji", () => {
    const a = defaultWushiAssessment("史密斯");
    assert.equal(a.factors.length, 5);
    assert.equal(a.qiji.length, 7);
    assert.equal(a.rival, "史密斯");
  });

  it("道/将/法 internal, 天/地 external with source modules", () => {
    const a = defaultWushiAssessment();
    const internal = internalFactors(a.factors).map((f) => f.key).sort();
    assert.deepEqual(internal, ["dao", "fa", "jiang"].sort());
    const di = a.factors.find((f) => f.key === "di")!;
    assert.equal(di.origin, "external");
    assert.equal(di.sourceModule, "/compass");
  });
});

describe("wushiReadiness", () => {
  it("counts statuses and external factors", () => {
    const a = defaultWushiAssessment();
    const r = wushiReadiness(a.factors);
    assert.equal(r.ready + r.partial + r.gap, 5);
    assert.equal(r.externalCount, 2); // 天 + 地
    assert.equal(r.partial, 1); // 将 default partial
  });
});

describe("buildWushiRiskList", () => {
  it("partial factor → medium risk", () => {
    const a = defaultWushiAssessment();
    const risks = buildWushiRiskList(a);
    const jiang = risks.find((x) => x.source === "将");
    assert.ok(jiang);
    assert.equal(jiang!.severity, "medium");
    assert.equal(jiang!.kind, "factor");
  });

  it("gap factor → high risk and sorts before medium", () => {
    const a: WushiAssessment = defaultWushiAssessment();
    a.factors.find((f) => f.key === "fa")!.status = "gap";
    const risks = buildWushiRiskList(a);
    assert.equal(risks[0].severity, "high");
    assert.ok(risks.some((r) => r.source === "法" && r.severity === "high"));
  });

  it("rival_lead → high, unknown → medium for 七计", () => {
    const a = defaultWushiAssessment("史密斯");
    a.qiji.find((q) => q.key === "jiang_neng")!.verdict = "rival_lead";
    a.qiji.find((q) => q.key === "zhu_dao")!.verdict = "we_lead";
    const risks = buildWushiRiskList(a);
    const rivalRisk = risks.find((r) => r.source === "将孰有能");
    assert.ok(rivalRisk);
    assert.equal(rivalRisk!.severity, "high");
    assert.ok(rivalRisk!.message.includes("史密斯"));
    // we_lead produces no risk
    assert.equal(risks.find((r) => r.source === "主孰有道"), undefined);
  });
});

describe("qijiTally", () => {
  it("counts all four verdicts", () => {
    const a = defaultWushiAssessment();
    a.qiji[0].verdict = "we_lead";
    a.qiji[1].verdict = "rival_lead";
    a.qiji[2].verdict = "tie";
    const t = qijiTally(a.qiji);
    assert.equal(t.weLead, 1);
    assert.equal(t.rivalLead, 1);
    assert.equal(t.tie, 1);
    assert.equal(t.unknown, 4); // remaining default unknown
  });
});

describe("deriveQijiVerdicts", () => {
  it("derives verdicts from Hermes signals and tracks", () => {
    const qiji = deriveQijiVerdicts({
      signals: demoSignals,
      tracks: demoTracks,
      selfScores: demoSelfScores,
      rival: "史密斯",
    });
    assert.equal(qiji.length, 7);
    assert.ok(qiji.some((q) => q.verdict !== "unknown"), "should produce at least one non-unknown verdict");
    assert.ok(qiji.every((q) => q.note), "every derived qiji should carry a note");
  });
});
