import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AGENT_PROMPTS, getAgentPrompt } from "./agent-prompts";
import { STRAT_AGENTS } from "./agents";
import { runAgentOrchestrationSmart } from "./llm-orchestration";
import { parseReportContent } from "./report-agent";

describe("agent-prompts", () => {
  it("has a prompt for every registered agent", () => {
    for (const agent of STRAT_AGENTS) {
      const prompt = getAgentPrompt(agent);
      assert.ok(prompt, `Missing prompt for agent ${agent.id}`);
      assert.ok(prompt!.system.length > 20, `System prompt too short for ${agent.id}`);
      assert.equal(typeof prompt!.user, "function", `user must be a function for ${agent.id}`);
    }
  });

  it("a01 prompt produces valid JSON context", () => {
    const ctx = {
      parsed: parseReportContent("rpt-1", "test line\n§8 涌现：something", "2026-05"),
      rawContent: "test line\n§8 涌现：something",
      reportId: "rpt-1",
      period: "2026-05",
    };
    const prompt = AGENT_PROMPTS.a01!;
    const userContent = prompt.user(ctx);
    const parsed = JSON.parse(userContent);
    assert.equal(parsed.reportId, "rpt-1");
    assert.equal(parsed.lineCount, 2);
  });

  it("a04 prompt includes assertion triggers and runway", () => {
    const ctx = {
      parsed: parseReportContent("rpt-1", "现金 runway 2.1 月", "2026-05"),
      rawContent: "现金 runway 2.1 月",
      reportId: "rpt-1",
      period: "2026-05",
      fpa: { cashRunwayMonths: 2.1 },
    };
    const prompt = AGENT_PROMPTS.a04!;
    const userContent = prompt.user(ctx);
    const parsed = JSON.parse(userContent);
    assert.ok(parsed.assertionTriggers.length > 0);
    assert.equal(parsed.runway, 2.1);
  });

  it("a08 prompt includes scenario probabilities and evidence", () => {
    const ctx = {
      parsed: parseReportContent("rpt-1", "test", "2026-05"),
      rawContent: "test",
      reportId: "rpt-1",
      period: "2026-05",
      spbpScenarios: [
        { id: "s1", name: "乐观", probability: 40 },
        { id: "s2", name: "悲观", probability: 30 },
      ],
    };
    const prompt = AGENT_PROMPTS.a08!;
    const userContent = prompt.user(ctx);
    const parsed = JSON.parse(userContent);
    assert.equal(parsed.scenarios.length, 2);
    assert.equal(parsed.evidence.favorsPessimistic, false);
  });
});

describe("llm-orchestration (rules fallback)", () => {
  it("runs full 11-agent orchestration with rules engine", async () => {
    const raw = "§8 涌现：区县经销商自发组团签约\n现金 runway 2.1 月\n覆盖：酒店签约 820/1200";
    const result = await runAgentOrchestrationSmart("rpt-test", raw, "2026-05", false);

    assert.equal(result.engine, "rules");
    assert.equal(result.steps.length, 11);
    assert.equal(result.steps[0].agentId, "a01");
    assert.equal(result.steps[10].agentId, "a11");

    const a02 = result.steps.find((s) => s.agentId === "a02")!;
    assert.ok(a02.output.some((o) => o.includes("emergent")), "MintzbergScanner should detect emergent pattern");

    const a04 = result.steps.find((s) => s.agentId === "a04")!;
    assert.equal(a04.status, "done", "HealthAssertion should trigger on runway < 3");

    const a03 = result.steps.find((s) => s.agentId === "a03")!;
    assert.equal(a03.status, "done", "CoverageExtractor should detect coverage line");

    assert.ok(result.recommendations.length > 0, "Should have recommendations");
    assert.ok(result.recommendations.some((r) => r.includes("runway")), "Should recommend runway action");
  });

  it("returns spbpScenarios with updated probabilities", async () => {
    const raw = "现金 runway 2.1 月";
    const result = await runAgentOrchestrationSmart("rpt-test", raw, "2026-05", false);
    assert.ok(result.spbpScenarios.length > 0);
    const total = result.spbpScenarios.reduce((sum, s) => sum + s.probability, 0);
    assert.equal(total, 100, "Scenario probabilities should sum to 100");
  });

  it("produces parsed report with patterns", async () => {
    const raw = "§8 涌现：区县经销商自发组团签约，建议下版 deliberate 候选";
    const result = await runAgentOrchestrationSmart("rpt-test", raw, "2026-05", false);
    assert.ok(result.parsed.patterns.length > 0);
    assert.ok(result.parsed.patterns.some((p) => p.formationType === "emergent"));
    assert.ok(result.parsed.patterns.some((p) => p.suggestDeliberate));
  });
});
