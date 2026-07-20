/**
 * LLM-first 11-Agent orchestration — per-agent parallel prompts, rules fallback when no API key.
 */
import { llmConfigured, parseReportSmart } from "./llm-agent";
import { parseReportContent, type ParsedReport } from "./report-agent";
import { updateScenarioProbabilities } from "./spbp-bayes";
import { computeRobustOverall } from "./robust-score";
import {
  STRAT_AGENTS,
  type AgentStepResult,
  type OrchestrationResult,
  type StratAgent,
} from "./agents";
import { getAgentPrompt, type AgentContext } from "./agent-prompts";
import { gatherAgentContext } from "./agent-context";
import * as demo from "@/lib/stratos-demo-data";

function step(
  agent: StratAgent,
  status: AgentStepResult["status"],
  output: string[],
  start: number
): AgentStepResult {
  return {
    agentId: agent.id,
    name: agent.name,
    status,
    output,
    durationMs: Date.now() - start,
  };
}

interface AgentLlmResult {
  agentId: string;
  output: string[];
  status: "done" | "skipped";
}

function llmApiKey(): string | undefined {
  return process.env.STRATOS_LLM_API_KEY ?? process.env.OPENAI_API_KEY;
}

function llmBaseUrl(): string {
  return (
    process.env.STRATOS_LLM_BASE_URL ??
    process.env.OPENAI_BASE_URL ??
    "https://api.openai.com/v1"
  ).replace(/\/$/, "");
}

function llmModel(): string {
  return process.env.STRATOS_LLM_MODEL ?? "gpt-4o-mini";
}

async function callAgentLlm(
  agent: StratAgent,
  ctx: AgentContext
): Promise<AgentLlmResult | null> {
  const prompt = getAgentPrompt(agent);
  if (!prompt) return null;
  const apiKey = llmApiKey();
  if (!apiKey) return null;

  try {
    const res = await fetch(`${llmBaseUrl()}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: llmModel(),
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: prompt.system },
          { role: "user", content: prompt.user(ctx) },
        ],
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;
    const parsed = JSON.parse(content) as {
      output?: string[];
      status?: string;
    };
    return {
      agentId: agent.id,
      output: parsed.output?.length ? parsed.output : [`LLM · ${agent.role}`],
      status: parsed.status === "skipped" ? "skipped" : "done",
    };
  } catch {
    return null;
  }
}

async function orchestrateWithLlmPerAgent(
  ctx: AgentContext
): Promise<{ steps: AgentLlmResult[]; recommendations: string[] } | null> {
  if (!llmConfigured()) return null;

  const results = await Promise.allSettled(
    STRAT_AGENTS.map((agent) => callAgentLlm(agent, ctx))
  );

  const steps: AgentLlmResult[] = STRAT_AGENTS.map((agent, i) => {
    const r = results[i];
    if (r.status === "fulfilled" && r.value) return r.value;
    return { agentId: agent.id, output: [`LLM fallback · ${agent.role}`], status: "done" };
  });

  const recommendations: string[] = [];
  if (ctx.parsed.assertionTriggers.length) {
    recommendations.push("优先处理 runway 硬阻断");
  }
  if (ctx.parsed.patterns.some((p) => p.suggestDeliberate)) {
    recommendations.push("涌现写入 deliberate");
  }
  recommendations.push("战略会包：/rehearsal");

  return { steps, recommendations };
}

async function orchestrateWithRules(
  ctx: AgentContext
): Promise<OrchestrationResult> {
  const { reportId, rawContent, parsed } = ctx;
  const steps: AgentStepResult[] = [];
  let t = Date.now();

  steps.push(
    step(STRAT_AGENTS[0], "done", [`lines: ${rawContent.split("\n").length}`, "rules"], t)
  );
  t = Date.now();
  steps.push(
    step(
      STRAT_AGENTS[1],
      "done",
      parsed.patterns.map((p) => `${p.formationType}: ${p.title.slice(0, 60)}`),
      t
    )
  );
  t = Date.now();
  steps.push(
    step(
      STRAT_AGENTS[2],
      parsed.coverageUpdates.length ? "done" : "skipped",
      parsed.coverageUpdates.length ? parsed.coverageUpdates : ["无 coverage"],
      t
    )
  );
  t = Date.now();
  steps.push(
    step(
      STRAT_AGENTS[3],
      parsed.assertionTriggers.length ? "done" : "skipped",
      parsed.assertionTriggers.length ? parsed.assertionTriggers : ["无硬阻断"],
      t
    )
  );
  t = Date.now();
  steps.push(
    step(
      STRAT_AGENTS[4],
      "done",
      [
        `营收 F ${ctx.fpa?.revenueForecast ?? demo.fpa.revenueForecast}`,
        `runway ${ctx.fpa?.cashRunwayMonths ?? demo.fpa.cashRunwayMonths}月`,
      ],
      t
    )
  );
  t = Date.now();
  steps.push(
    step(
      STRAT_AGENTS[5],
      "done",
      (ctx.stratDiffs ?? demo.stratDiffs).slice(0, 3).map((d) => d.title),
      t
    )
  );
  t = Date.now();
  steps.push(
    step(
      STRAT_AGENTS[6],
      "done",
      (ctx.gateItems ?? []).map((g) => `${g.gate} ${g.status} — ${g.note}`),
      t
    )
  );
  t = Date.now();
  const scenarios = ctx.spbpScenarios?.length
    ? ctx.spbpScenarios.map((s) => ({
        id: s.id,
        name: s.name,
        probability: s.probability,
        drivers: [],
        fpaImpact: { revenue: 0, profit: 0, runwayMonths: 0 },
        linkedAssumptionCodes: [],
      }))
    : demo.spbpScenarios;
  const spbp = updateScenarioProbabilities(scenarios, {
    favorsPessimistic: parsed.assertionTriggers.length > 0,
    strength: 0.1,
  });
  steps.push(step(STRAT_AGENTS[7], "done", spbp.map((s) => `${s.name} ${s.probability}%`), t));
  t = Date.now();
  steps.push(
    step(
      STRAT_AGENTS[8],
      "done",
      (ctx.techSignals ?? demo.techSignals).map((s) => `TRL${s.trl} ${s.title}`),
      t
    )
  );
  t = Date.now();
  const robustOverall = computeRobustOverall(demo.robustScore);
  steps.push(step(STRAT_AGENTS[9], "done", [`综合 ${robustOverall}`], t));
  t = Date.now();
  const freezeBlockers = parsed.assertionTriggers.length
    ? ["HealthAssertion 活跃 — CEO 例外或修复 runway"]
    : ["可进入 H1 快照 WORKING→IN_REVIEW"];
  steps.push(step(STRAT_AGENTS[10], "done", freezeBlockers, t));

  const recommendations: string[] = [];
  if (parsed.assertionTriggers.length) recommendations.push("优先处理 runway 硬阻断");
  if (parsed.patterns.some((p) => p.suggestDeliberate)) recommendations.push("涌现写入 deliberate");
  recommendations.push("战略会包：/rehearsal");

  return {
    reportId,
    steps,
    parsed,
    spbpScenarios: spbp,
    robustOverall,
    recommendations,
  };
}

export async function runAgentOrchestrationSmart(
  reportId: string,
  rawContent: string,
  period = "2026-05",
  preferLlm = true
): Promise<OrchestrationResult & { engine: "llm" | "rules" }> {
  const { parsed, engine: parseEngine } = await parseReportSmart(
    reportId,
    rawContent,
    period,
    preferLlm
  );

  const ctx = await gatherAgentContext(reportId, rawContent, parsed, period);

  if (preferLlm && llmConfigured()) {
    const llm = await orchestrateWithLlmPerAgent(ctx);
    if (llm) {
      const steps: AgentStepResult[] = STRAT_AGENTS.map((agent) => {
        const match = llm.steps.find((s) => s.agentId === agent.id);
        return step(
          agent,
          (match?.status as AgentStepResult["status"]) ?? "done",
          match?.output?.length ? match.output : [`LLM · ${agent.role}`],
          Date.now()
        );
      });
      const scenarios = ctx.spbpScenarios?.length
        ? ctx.spbpScenarios.map((s) => ({
            id: s.id,
            name: s.name,
            probability: s.probability,
            drivers: [],
            fpaImpact: { revenue: 0, profit: 0, runwayMonths: 0 },
            linkedAssumptionCodes: [],
          }))
        : demo.spbpScenarios;
      const spbp = updateScenarioProbabilities(scenarios, {
        favorsPessimistic: parsed.assertionTriggers.length > 0,
        strength: 0.1,
      });
      return {
        reportId,
        steps,
        parsed,
        spbpScenarios: spbp,
        robustOverall: computeRobustOverall(demo.robustScore),
        recommendations: llm.recommendations?.length
          ? llm.recommendations
          : ["LLM 编排完成"],
        engine: "llm",
      };
    }
  }

  const rules = await orchestrateWithRules(ctx);
  return { ...rules, parsed, engine: parseEngine === "llm" ? "llm" : "rules" };
}

export type OrchestrationEvent =
  | { type: "step"; step: AgentStepResult; index: number; total: number }
  | { type: "done"; result: OrchestrationResult & { engine: "llm" | "rules" } }
  | { type: "error"; message: string };

export async function* runAgentOrchestrationStreaming(
  reportId: string,
  rawContent: string,
  period = "2026-05",
  preferLlm = true
): AsyncGenerator<OrchestrationEvent> {
  try {
    const { parsed, engine: parseEngine } = await parseReportSmart(
      reportId, rawContent, period, preferLlm
    );
    const ctx = await gatherAgentContext(reportId, rawContent, parsed, period);
    const steps: AgentStepResult[] = [];
    const useLlm = preferLlm && llmConfigured();

    if (useLlm) {
      const llm = await orchestrateWithLlmPerAgent(ctx);
      if (llm) {
        for (let i = 0; i < STRAT_AGENTS.length; i++) {
          const agent = STRAT_AGENTS[i];
          const match = llm.steps.find((s) => s.agentId === agent.id);
          const s = step(
            agent,
            (match?.status as AgentStepResult["status"]) ?? "done",
            match?.output?.length ? match.output : [`LLM · ${agent.role}`],
            Date.now()
          );
          steps.push(s);
          yield { type: "step", step: s, index: i, total: STRAT_AGENTS.length };
        }
        const scenarios = ctx.spbpScenarios?.length
          ? ctx.spbpScenarios.map((s) => ({
              id: s.id, name: s.name, probability: s.probability,
              drivers: [], fpaImpact: { revenue: 0, profit: 0, runwayMonths: 0 },
              linkedAssumptionCodes: [],
            }))
          : demo.spbpScenarios;
        const spbp = updateScenarioProbabilities(scenarios, {
          favorsPessimistic: parsed.assertionTriggers.length > 0,
          strength: 0.1,
        });
        const result: OrchestrationResult & { engine: "llm" | "rules" } = {
          reportId, steps, parsed, spbpScenarios: spbp,
          robustOverall: computeRobustOverall(demo.robustScore),
          recommendations: llm.recommendations?.length ? llm.recommendations : ["LLM 编排完成"],
          engine: "llm",
        };
        yield { type: "done", result };
        return;
      }
    }

    for (let i = 0; i < STRAT_AGENTS.length; i++) {
      const agent = STRAT_AGENTS[i];
      const s = await runSingleRuleStep(agent, i, ctx);
      steps.push(s);
      yield { type: "step", step: s, index: i, total: STRAT_AGENTS.length };
    }
    const rulesResult = await orchestrateWithRules(ctx);
    const result: OrchestrationResult & { engine: "llm" | "rules" } = {
      ...rulesResult, parsed, engine: parseEngine === "llm" ? "llm" : "rules",
    };
    yield { type: "done", result };
  } catch (err) {
    yield { type: "error", message: err instanceof Error ? err.message : "Unknown orchestration error" };
  }
}

async function runSingleRuleStep(
  agent: StratAgent, _index: number, ctx: AgentContext
): Promise<AgentStepResult> {
  const t = Date.now();
  const { rawContent, parsed } = ctx;

  switch (agent.id) {
    case "a01":
      return step(agent, "done", [`lines: ${rawContent.split("\n").length}`, "rules"], t);
    case "a02":
      return step(agent, "done",
        parsed.patterns.map((p) => `${p.formationType}: ${p.title.slice(0, 60)}`), t);
    case "a03":
      return step(agent, parsed.coverageUpdates.length ? "done" : "skipped",
        parsed.coverageUpdates.length ? parsed.coverageUpdates : ["无 coverage"], t);
    case "a04":
      return step(agent, parsed.assertionTriggers.length ? "done" : "skipped",
        parsed.assertionTriggers.length ? parsed.assertionTriggers : ["无硬阻断"], t);
    case "a05":
      return step(agent, "done", [
        `营收 F ${ctx.fpa?.revenueForecast ?? demo.fpa.revenueForecast}`,
        `runway ${ctx.fpa?.cashRunwayMonths ?? demo.fpa.cashRunwayMonths}月`,
      ], t);
    case "a06":
      return step(agent, "done",
        (ctx.stratDiffs ?? demo.stratDiffs).slice(0, 3).map((d) => d.title), t);
    case "a07":
      return step(agent, "done",
        (ctx.gateItems ?? []).map((g) => `${g.gate} ${g.status} — ${g.note}`), t);
    case "a08": {
      const scenarios = ctx.spbpScenarios?.length
        ? ctx.spbpScenarios.map((s) => ({
            id: s.id, name: s.name, probability: s.probability,
            drivers: [], fpaImpact: { revenue: 0, profit: 0, runwayMonths: 0 },
            linkedAssumptionCodes: [],
          }))
        : demo.spbpScenarios;
      const spbp = updateScenarioProbabilities(scenarios, {
        favorsPessimistic: parsed.assertionTriggers.length > 0, strength: 0.1,
      });
      return step(agent, "done", spbp.map((s) => `${s.name} ${s.probability}%`), t);
    }
    case "a09":
      return step(agent, "done",
        (ctx.techSignals ?? demo.techSignals).map((s) => `TRL${s.trl} ${s.title}`), t);
    case "a10":
      return step(agent, "done", [`综合 ${computeRobustOverall(demo.robustScore)}`], t);
    case "a11": {
      const freezeBlockers = parsed.assertionTriggers.length
        ? ["HealthAssertion 活跃 — CEO 例外或修复 runway"]
        : ["可进入 H1 快照 WORKING→IN_REVIEW"];
      return step(agent, "done", freezeBlockers, t);
    }
    default:
      return step(agent, "done", [`rules · ${agent.role}`], t);
  }
}

/** @deprecated use runAgentOrchestrationSmart */
export async function runAgentOrchestration(
  reportId: string,
  rawContent: string,
  period = "2026-05"
): Promise<OrchestrationResult> {
  const parsed = parseReportContent(reportId, rawContent, period);
  const ctx = await gatherAgentContext(reportId, rawContent, parsed, period);
  return orchestrateWithRules(ctx);
}
