/**
 * LLM-first 11-Agent orchestration — rules fallback when no API key.
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

interface LlmOrchestrationPayload {
  steps: Array<{ agentId: string; output: string[]; status?: string }>;
  recommendations: string[];
}

async function orchestrateWithLlm(
  reportId: string,
  rawContent: string,
  parsed: ParsedReport
): Promise<LlmOrchestrationPayload | null> {
  const apiKey = process.env.OPENAI_API_KEY ?? process.env.STRATOS_LLM_API_KEY;
  const baseUrl = (
    process.env.STRATOS_LLM_BASE_URL ??
    process.env.OPENAI_BASE_URL ??
    "https://api.openai.com/v1"
  ).replace(/\/$/, "");
  const model = process.env.STRATOS_LLM_MODEL ?? "gpt-4o-mini";
  if (!apiKey) return null;

  const agentList = STRAT_AGENTS.map((a) => `${a.id}:${a.name} — ${a.role}`).join("\n");

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are StratOS 11-Agent orchestrator for Rheem China strategy.
Return JSON: { steps: [{ agentId, output: string[], status: "done"|"skipped" }], recommendations: string[] }
One step per agent in order:\n${agentList}`,
          },
          {
            role: "user",
            content: JSON.stringify({
              reportId,
              patterns: parsed.patterns,
              coverageUpdates: parsed.coverageUpdates,
              assertionTriggers: parsed.assertionTriggers,
              excerpt: rawContent.slice(0, 6000),
            }),
          },
        ],
      }),
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;
    return JSON.parse(content) as LlmOrchestrationPayload;
  } catch {
    return null;
  }
}

function orchestrateWithRules(
  reportId: string,
  rawContent: string,
  parsed: ParsedReport
): OrchestrationResult {
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
      [`营收 F ${demo.fpa.revenueForecast}`, `runway ${demo.fpa.cashRunwayMonths}月`],
      t
    )
  );
  t = Date.now();
  steps.push(step(STRAT_AGENTS[5], "done", demo.stratDiffs.slice(0, 3).map((d) => d.title), t));
  t = Date.now();
  steps.push(step(STRAT_AGENTS[6], "done", ["Gate 风险清单"], t));
  t = Date.now();
  const spbp = updateScenarioProbabilities(demo.spbpScenarios, {
    favorsPessimistic: parsed.assertionTriggers.length > 0,
    strength: 0.1,
  });
  steps.push(step(STRAT_AGENTS[7], "done", spbp.map((s) => `${s.name} ${s.probability}%`), t));
  t = Date.now();
  steps.push(
    step(STRAT_AGENTS[8], "done", demo.techSignals.map((s) => `TRL${s.trl} ${s.title}`), t)
  );
  t = Date.now();
  const robustOverall = computeRobustOverall(demo.robustScore);
  steps.push(step(STRAT_AGENTS[9], "done", [`综合 ${robustOverall}`], t));
  t = Date.now();
  steps.push(step(STRAT_AGENTS[10], "done", ["快照冻结检查清单"], t));

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

  if (preferLlm && llmConfigured()) {
    const llm = await orchestrateWithLlm(reportId, rawContent, parsed);
    if (llm) {
      const steps: AgentStepResult[] = STRAT_AGENTS.map((agent, i) => {
        const match = llm.steps.find((s) => s.agentId === agent.id) ?? llm.steps[i];
        return step(
          agent,
          (match?.status as AgentStepResult["status"]) ?? "done",
          match?.output?.length ? match.output : [`LLM · ${agent.role}`],
          Date.now()
        );
      });
      const spbp = updateScenarioProbabilities(demo.spbpScenarios, {
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
        engine: parseEngine === "llm" ? "llm" : "llm",
      };
    }
  }

  const rules = orchestrateWithRules(reportId, rawContent, parsed);
  return { ...rules, parsed, engine: "rules" };
}

/** @deprecated use runAgentOrchestrationSmart */
export function runAgentOrchestration(
  reportId: string,
  rawContent: string,
  period = "2026-05"
): OrchestrationResult {
  const parsed = parseReportContent(reportId, rawContent, period);
  return orchestrateWithRules(reportId, rawContent, parsed);
}
