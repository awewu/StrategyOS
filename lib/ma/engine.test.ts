import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { dealEconomics, evaluateDealGate, footballField, synergyNpv } from "./engine";
import type { DealTypeThresholds } from "./types";

const thresholds: DealTypeThresholds = {
  maxPaybackYears: 6,
  minRoicOverWacc: 0,
  maxSynergyPctOfPrice: 0.5,
  minEvidenceLevel: 4,
};

describe("协同 NPV:爬坡与折现", () => {
  it("爬坡越快 NPV 越高", () => {
    const fast = synergyNpv([{ type: "cost", runRate: 1200, ramp: [0.5, 1, 1], oneTimeCost: 0, evidenceLevel: 5 }], 0.12);
    const slow = synergyNpv([{ type: "cost", runRate: 1200, ramp: [0.1, 0.4, 1], oneTimeCost: 0, evidenceLevel: 5 }], 0.12);
    assert.ok(fast > slow);
  });
  it("一次性成本扣减 NPV;空清单为 0", () => {
    const base = synergyNpv([{ type: "cost", runRate: 1000, ramp: [1], oneTimeCost: 0, evidenceLevel: 5 }], 0.1);
    const withCost = synergyNpv([{ type: "cost", runRate: 1000, ramp: [1], oneTimeCost: 500, evidenceLevel: 5 }], 0.1);
    assert.equal(base - withCost, 500);
    assert.equal(synergyNpv([], 0.1), 0);
  });
});

describe("Football Field:估值三角", () => {
  it("区间取各方法极值,中值为 base 中位数", () => {
    const ff = footballField([
      { method: "dcf", low: 140, base: 160, high: 180 },
      { method: "comps", low: 130, base: 140, high: 160 },
      { method: "precedent", low: 160, base: 180, high: 200 },
    ]);
    assert.ok(ff);
    assert.equal(ff.low, 130);
    assert.equal(ff.high, 200);
    assert.equal(ff.medianBase, 160);
  });
  it("空输入返回 null", () => {
    assert.equal(footballField([]), null);
  });
});

describe("交易经济性红线", () => {
  it("协同占对价 = NPV/价格;价差扩大红线触发翻转", () => {
    const ok = dealEconomics({ price: 17000, synergyNpvValue: 8000, roic: 0.14, wacc: 0.12 });
    assert.ok(ok.synergyPctOfPrice < 0.5);
    const bad = dealEconomics({ price: 12000, synergyNpvValue: 8000, roic: 0.14, wacc: 0.12 });
    assert.ok(bad.synergyPctOfPrice > 0.5);
  });
});

describe("交易 Gate:形态画像驱动裁决", () => {
  const okEcon = { synergyPctOfPrice: 0.47, roicSpread: 0.02, paybackYears: 5.5 };

  it("红线擦边 → warning 不 kill;全达标且无 CP → go", () => {
    const r = evaluateDealGate({
      economics: okEcon, minEvidence: 4, thresholds,
      requiredFlags: [], flags: {}, openDealBreakers: [], openConditions: [], strict: true,
    });
    assert.equal(r.verdict, "go");
    assert.ok(r.warnings.some((w) => w.includes("逼近红线")));
  });

  it("协同占比破 50% → strict 下 kill", () => {
    const r = evaluateDealGate({
      economics: { ...okEcon, synergyPctOfPrice: 0.6 }, minEvidence: 4, thresholds,
      requiredFlags: [], flags: {}, openDealBreakers: [], openConditions: [], strict: true,
    });
    assert.equal(r.verdict, "kill");
  });

  it("同样问题在非 strict 阶段 → hold(宽进严出)", () => {
    const r = evaluateDealGate({
      economics: { ...okEcon, synergyPctOfPrice: 0.6 }, minEvidence: 4, thresholds,
      requiredFlags: [], flags: {}, openDealBreakers: [], openConditions: [], strict: false,
    });
    assert.equal(r.verdict, "hold");
  });

  it("JV 必备条款缺失(僵局机制)→ kill:否决规则是数据不是代码", () => {
    const r = evaluateDealGate({
      economics: okEcon, minEvidence: 4, thresholds,
      requiredFlags: [{ key: "deadlock_mechanism", label: "僵局解决机制" }],
      flags: { deadlock_mechanism: false },
      openDealBreakers: [], openConditions: [], strict: true,
    });
    assert.equal(r.verdict, "kill");
    assert.ok(r.blockers.some((b) => b.includes("僵局")));
  });

  it("CP 未关 → hold;关掉后 → go", () => {
    const open = evaluateDealGate({
      economics: okEcon, minEvidence: 4, thresholds,
      requiredFlags: [], flags: {}, openDealBreakers: [], openConditions: ["专利权属清理"], strict: true,
    });
    assert.equal(open.verdict, "hold");
    const closed = evaluateDealGate({
      economics: okEcon, minEvidence: 4, thresholds,
      requiredFlags: [], flags: {}, openDealBreakers: [], openConditions: [], strict: true,
    });
    assert.equal(closed.verdict, "go");
  });

  it("deal-breaker 未解 → strict kill", () => {
    const r = evaluateDealGate({
      economics: okEcon, minEvidence: 4, thresholds,
      requiredFlags: [], flags: {}, openDealBreakers: ["核心专利属第三方"], openConditions: [], strict: true,
    });
    assert.equal(r.verdict, "kill");
  });

  it("证据最短板低于形态门槛 → kill(L2 收入协同撑估值检得出)", () => {
    const r = evaluateDealGate({
      economics: okEcon, minEvidence: 2, thresholds,
      requiredFlags: [], flags: {}, openDealBreakers: [], openConditions: [], strict: true,
    });
    assert.equal(r.verdict, "kill");
  });

  it("形态阈值可配:同一交易,财务型(3年)kill、能力型(6年)go", () => {
    const financial = evaluateDealGate({
      economics: okEcon, minEvidence: 4,
      thresholds: { ...thresholds, maxPaybackYears: 3 },
      requiredFlags: [], flags: {}, openDealBreakers: [], openConditions: [], strict: true,
    });
    assert.equal(financial.verdict, "kill");
    const strategic = evaluateDealGate({
      economics: okEcon, minEvidence: 4, thresholds,
      requiredFlags: [], flags: {}, openDealBreakers: [], openConditions: [], strict: true,
    });
    assert.equal(strategic.verdict, "go");
  });
});
