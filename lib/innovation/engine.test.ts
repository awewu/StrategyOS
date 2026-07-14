import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  annualArbitrageSaving,
  composeDFV,
  computeDesirability,
  computeFeasibility,
  computePaybackYears,
  computeViability,
  evaluateGate,
  evidenceStrength,
  groundedEvidenceLevel,
  odiOpportunity,
  recommendSourcing,
} from "./engine";
import type { FeasibilityDimension, GateThresholds } from "./types";

describe("接地门:无物证证据封顶 L2", () => {
  it("L4 无物证 → 按 L2 计", () => {
    assert.equal(groundedEvidenceLevel(4, false), 2);
  });

  it("L4 有物证 → 保持 L4", () => {
    assert.equal(groundedEvidenceLevel(4, true), 4);
  });

  it("L1/L2 不受影响", () => {
    assert.equal(groundedEvidenceLevel(1, false), 1);
    assert.equal(groundedEvidenceLevel(2, false), 2);
  });

  it("未接地的 L6 无法拉高最短板绕过 evidenceBar", () => {
    const grounded = [groundedEvidenceLevel(6, false), groundedEvidenceLevel(5, false)];
    assert.equal(evidenceStrength(grounded), 2);
  });
});

const thresholds: GateThresholds = {
  maxPaybackYears: 3,
  minRoicOverWacc: 0,
  minScore: 50,
  minEvidenceLevel: 4,
};

describe("经济性:回收期随因素变化", () => {
  it("价差下降 → 年节省下降 → 回收期变长", () => {
    const base = { dailyShiftedKwh: 40, activeDays: 330, roundTripEff: 0.85 };
    const savingHigh = annualArbitrageSaving({ ...base, priceSpread: 0.7 });
    const savingLow = annualArbitrageSaving({ ...base, priceSpread: 0.5 });
    assert.ok(savingHigh > savingLow);
    assert.ok(computePaybackYears(20000, savingHigh) < computePaybackYears(20000, savingLow));
  });

  it("同溢价下:工商业场景过 3 年门槛,户用不过", () => {
    const commercial = annualArbitrageSaving({ dailyShiftedKwh: 40, activeDays: 330, priceSpread: 0.7, roundTripEff: 0.85 });
    const residential = annualArbitrageSaving({ dailyShiftedKwh: 15, activeDays: 150, priceSpread: 0.7, roundTripEff: 0.85 });
    assert.ok(computePaybackYears(20000, commercial) <= 3);
    assert.ok(computePaybackYears(20000, residential) > 3);
  });

  it("零节省 → 回收期无穷大(不崩)", () => {
    assert.equal(computePaybackYears(20000, 0), Infinity);
  });
});

describe("可行性:死穴权重迁移改变 F 分", () => {
  const dims: FeasibilityDimension[] = [
    { key: "material", score: 40, evidenceLevel: 3 },
    { key: "cost", score: 80, evidenceLevel: 4 },
  ];
  it("材料权重高 → F 低;成本权重高 → F 高", () => {
    const materialHeavy = computeFeasibility(dims, { material: 0.6, cost: 0.4 });
    const costHeavy = computeFeasibility(dims, { material: 0.2, cost: 0.8 });
    assert.ok(costHeavy > materialHeavy);
  });
  it("权重全零 → 退化为等权,不崩", () => {
    const f = computeFeasibility(dims, {});
    assert.equal(f, 60);
  });
});

describe("证据强度 = 最短板", () => {
  it("取最小级别", () => {
    assert.equal(evidenceStrength([6, 4, 3, 5]), 3);
    assert.equal(evidenceStrength([]), 1);
  });
});

describe("Gate:因素变化导致裁决翻转", () => {
  const okEconomics = { paybackYears: 2.5, roic: 0.18, wacc: 0.12 };
  const okScores = composeDFV(70, 60, 65);

  it("论证达标 + 假设已验证 → go", () => {
    const r = evaluateGate({
      scores: okScores,
      minEvidence: 4,
      thresholds,
      economics: okEconomics,
      killerAssumptions: [{ code: "H-price", status: "validated" }],
    });
    assert.equal(r.verdict, "go");
    assert.equal(r.blockers.length, 0);
  });

  it("回收期超阈值 → kill", () => {
    const r = evaluateGate({
      scores: okScores,
      minEvidence: 4,
      thresholds,
      economics: { ...okEconomics, paybackYears: 14.9 },
      killerAssumptions: [],
    });
    assert.equal(r.verdict, "kill");
    assert.ok(r.blockers.some((b) => b.includes("回收期")));
  });

  it("证据低于门槛 → kill", () => {
    const r = evaluateGate({
      scores: okScores,
      minEvidence: 3,
      thresholds,
      economics: okEconomics,
      killerAssumptions: [],
    });
    assert.equal(r.verdict, "kill");
    assert.ok(r.blockers.some((b) => b.includes("证据不足")));
  });

  it("杀手假设已证伪 → kill", () => {
    const r = evaluateGate({
      scores: okScores,
      minEvidence: 4,
      thresholds,
      economics: okEconomics,
      killerAssumptions: [{ code: "H-material-cost", status: "failed" }],
    });
    assert.equal(r.verdict, "kill");
  });

  it("仅有待证伪假设 → hold", () => {
    const r = evaluateGate({
      scores: okScores,
      minEvidence: 4,
      thresholds,
      economics: okEconomics,
      killerAssumptions: [{ code: "H-material-cost", status: "pending" }],
    });
    assert.equal(r.verdict, "hold");
  });
});

describe("Sourcing:缺口/死穴迁移改变 build/buy/partner", () => {
  it("自研慢于时间窗 → buy", () => {
    const [r] = recommendSourcing([
      { capability: "storage-material", internalReadiness: 0.2, windowMonths: 12, buildMonths: 24 },
    ]);
    assert.equal(r.decision, "buy");
  });

  it("内部就绪且时间充足 → build", () => {
    const [r] = recommendSourcing([
      { capability: "ems", internalReadiness: 0.7, windowMonths: 18, buildMonths: 12 },
    ]);
    assert.equal(r.decision, "build");
  });

  it("时间窗收紧 → 同一能力从 build 翻转为 buy", () => {
    const [r] = recommendSourcing([
      { capability: "ems", internalReadiness: 0.7, windowMonths: 6, buildMonths: 12 },
    ]);
    assert.equal(r.decision, "buy");
  });

  it("能力不足但时间尚可 → partner", () => {
    const [r] = recommendSourcing([
      { capability: "ems", internalReadiness: 0.3, windowMonths: 24, buildMonths: 12 },
    ]);
    assert.equal(r.decision, "partner");
  });
});

describe("Desirability / Viability", () => {
  it("ODI 机会分:满意度越低机会越高", () => {
    assert.ok(odiOpportunity({ importance: 9, satisfaction: 3 }) > odiOpportunity({ importance: 9, satisfaction: 8 }));
  });
  it("WTP 折减降低 D 分", () => {
    const odis = [{ importance: 9, satisfaction: 3 }];
    assert.ok(computeDesirability(odis, 1) > computeDesirability(odis, 0.5));
  });
  it("回收期越短、ROIC 溢价越高 → V 越高", () => {
    const ref = { targetPaybackYears: 3, minRoicSpread: 0.05 };
    const good = computeViability({ paybackYears: 2, roic: 0.2, wacc: 0.12 }, ref);
    const bad = computeViability({ paybackYears: 6, roic: 0.13, wacc: 0.12 }, ref);
    assert.ok(good > bad);
  });
});
