/**
 * StratOS 11-Agent registry — Phase 3 orchestration subset.
 * Full LLM wiring deferred to V6.3+; MVP runs rule-based handlers.
 */
import { parseReportContent, type ParsedReport } from "./report-agent";
import { updateScenarioProbabilities } from "./spbp-bayes";
import { computeRobustOverall } from "./robust-score";
import * as demo from "@/lib/stratos-demo-data";

export type AgentStatus = "idle" | "running" | "done" | "skipped";

export interface StratAgent {
  id: string;
  name: string;
  role: string;
  handler: "report" | "fpa" | "gate" | "spbp" | "robust" | "snapshot";
}

export interface AgentStepResult {
  agentId: string;
  name: string;
  status: AgentStatus;
  output: string[];
  durationMs: number;
}

export interface OrchestrationResult {
  reportId: string;
  steps: AgentStepResult[];
  parsed: ParsedReport;
  spbpScenarios: ReturnType<typeof updateScenarioProbabilities>;
  robustOverall: number;
  recommendations: string[];
}

export const STRAT_AGENTS: StratAgent[] = [
  { id: "a01", name: "ReportIngest", role: "报告归一化 · Sheet/月报入库", handler: "report" },
  { id: "a02", name: "MintzbergScanner", role: "§8 涌现/未实现/偶成", handler: "report" },
  { id: "a03", name: "CoverageExtractor", role: "GtmStack 覆盖率 actual", handler: "report" },
  { id: "a04", name: "HealthAssertion", role: "一票否决 runway/合规", handler: "report" },
  { id: "a05", name: "FpaReconciler", role: "B-A-F 与 budget_tag 对齐", handler: "fpa" },
  { id: "a06", name: "StratDiffAnalyst", role: "30 类 diff 归因", handler: "report" },
  { id: "a07", name: "GateAuditor", role: "Invest/Innovate/Deliver 风险清单", handler: "gate" },
  { id: "a08", name: "SpbpForecaster", role: "情景概率 nudge", handler: "spbp" },
  { id: "a09", name: "TechSignalScanner", role: "TRL 雷达增量", handler: "report" },
  { id: "a10", name: "RobustScorer", role: "R1–R6 加权", handler: "robust" },
  { id: "a11", name: "SnapshotAdvisor", role: "冻结前检查清单", handler: "snapshot" },
];

function step(
  agent: StratAgent,
  status: AgentStatus,
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

export function runAgentOrchestration(
  reportId: string,
  rawContent: string,
  period = "2026-05"
): OrchestrationResult {
  const steps: AgentStepResult[] = [];
  let t = Date.now();

  const parsed = parseReportContent(reportId, rawContent, period);
  steps.push(
    step(STRAT_AGENTS[0], "done", [`lines: ${rawContent.split("\n").length}`, "utf-8 ok"], t)
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
      parsed.coverageUpdates.length ? parsed.coverageUpdates : ["无 coverage 增量"],
      t
    )
  );

  t = Date.now();
  steps.push(
    step(
      STRAT_AGENTS[3],
      parsed.assertionTriggers.length ? "done" : "skipped",
      parsed.assertionTriggers.length ? parsed.assertionTriggers : ["无硬阻断触发"],
      t
    )
  );

  t = Date.now();
  const fpaLine = `营收 F ${demo.fpa.revenueForecast} · runway ${demo.fpa.cashRunwayMonths}月`;
  steps.push(step(STRAT_AGENTS[4], "done", [fpaLine, "budget_tag 链路 3 栈已挂"], t));

  t = Date.now();
  const topDiff = demo.stratDiffs.slice(0, 3).map((d) => d.title);
  steps.push(step(STRAT_AGENTS[5], "done", topDiff, t));

  t = Date.now();
  steps.push(
    step(STRAT_AGENTS[6], "done", ["IC-04 review 黄灯", "V4 Gate 产能假设待补"], t)
  );

  t = Date.now();
  const spbp = updateScenarioProbabilities(demo.spbpScenarios, {
    favorsPessimistic: parsed.assertionTriggers.length > 0,
    strength: 0.1,
  });
  steps.push(
    step(
      STRAT_AGENTS[7],
      "done",
      spbp.map((s) => `${s.name} ${s.probability}%`),
      t
    )
  );

  t = Date.now();
  steps.push(
    step(STRAT_AGENTS[8], "done", demo.techSignals.map((s) => `TRL${s.trl} ${s.title}`), t)
  );

  t = Date.now();
  const robustOverall = computeRobustOverall(demo.robustScore);
  steps.push(step(STRAT_AGENTS[9], "done", [`综合 ${robustOverall}`, "R6 学习 58 待提升"], t));

  t = Date.now();
  const freezeBlockers = parsed.assertionTriggers.length
    ? ["HealthAssertion 活跃 — CEO 例外或修复 runway"]
    : ["CapStack 波峰 9 月需确认", "可进入 H1 快照 WORKING→IN_REVIEW"];
  steps.push(step(STRAT_AGENTS[10], parsed.assertionTriggers.length ? "done" : "done", freezeBlockers, t));

  const recommendations: string[] = [];
  if (parsed.assertionTriggers.length) {
    recommendations.push("优先：FPA 现金 · 指挥舱 HardBlockBar 已应亮起");
  }
  if (parsed.patterns.some((p) => p.suggestDeliberate)) {
    recommendations.push("涌现模式建议写入下版 deliberate — 见 /versions StrategyPattern");
  }
  recommendations.push("战略会包：/rehearsal → 资本 30m 环节");

  return {
    reportId,
    steps,
    parsed,
    spbpScenarios: spbp,
    robustOverall,
    recommendations,
  };
}
