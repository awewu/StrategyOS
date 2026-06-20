import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { updateScenarioProbabilities, weightedRunway } from "./spbp-bayes";
import { parseReportContent } from "./report-agent";

describe("spbp-bayes", () => {
  it("normalizes probabilities after nudge", () => {
    const base = [
      {
        id: "a",
        name: "基准",
        probability: 55,
        drivers: [],
        fpaImpact: { revenue: 5800, profit: 820, runwayMonths: 2.1 },
        linkedAssumptionCodes: [],
      },
      {
        id: "b",
        name: "乐观",
        probability: 20,
        drivers: [],
        fpaImpact: { revenue: 6400, profit: 980, runwayMonths: 3.2 },
        linkedAssumptionCodes: [],
      },
      {
        id: "c",
        name: "悲观",
        probability: 25,
        drivers: [],
        fpaImpact: { revenue: 5200, profit: 580, runwayMonths: 1.4 },
        linkedAssumptionCodes: [],
      },
    ];
    const updated = updateScenarioProbabilities(base, { favorsPessimistic: true, strength: 0.2 });
    const sum = updated.reduce((a, s) => a + s.probability, 0);
    assert.equal(sum, 100);
    const pess = updated.find((s) => s.name === "悲观")!;
    assert.ok(pess.probability > 25);
  });

  it("computes weighted runway", () => {
    const scenarios = [
      {
        id: "a",
        name: "基准",
        probability: 50,
        drivers: [],
        fpaImpact: { revenue: 0, profit: 0, runwayMonths: 2 },
        linkedAssumptionCodes: [],
      },
      {
        id: "b",
        name: "悲观",
        probability: 50,
        drivers: [],
        fpaImpact: { revenue: 0, profit: 0, runwayMonths: 1 },
        linkedAssumptionCodes: [],
      },
    ];
    assert.equal(weightedRunway(scenarios), 1.5);
  });
});

describe("report-agent", () => {
  it("extracts emergent pattern and runway assertion", () => {
    const raw = `§8 涌现：区县经销商自发组团签约
现金 runway 2.1 月`;
    const result = parseReportContent("rpt-test", raw, "2026-05");
    assert.equal(result.status, "parsed");
    assert.ok(result.patterns.some((p) => p.formationType === "emergent"));
    assert.ok(result.assertionTriggers.length > 0);
  });

  it("parses optional McKinsey SCR sections", () => {
    const raw = `§S 背景：Q2 按 B 轨
§C 症结：runway 2.1 月
§R 建议：冻结 H3 CAPEX
§MECE 关键议题
- FPA runway
§So what 启示
- SPBP 悲观加权
§Decisions 待决
- [ ] CAPEX 分期 · CFO`;
    const result = parseReportContent("rpt-mck", raw, "2026-05");
    assert.ok(result.mckinsey?.situation?.includes("Q2"));
    assert.ok(result.mckinsey?.keyIssues?.includes("FPA runway"));
    assert.ok(result.agentTrace.some((t) => t.includes("McKinseyParser")));
  });
});
