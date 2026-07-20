import type { StratAgent } from "./agents";
import type { ParsedReport } from "./report-agent";

export interface AgentContext {
  parsed: ParsedReport;
  rawContent: string;
  reportId: string;
  period: string;
  fpa?: { revenueForecast?: number; cashRunwayMonths?: number; profitForecast?: number };
  projects?: Array<{ code: string; name: string; status: string; riskLevel?: string }>;
  healthOverview?: { score: number; kpis: Array<{ name: string; value: string; status: string }> };
  spbpScenarios?: Array<{ id: string; name: string; probability: number }>;
  techSignals?: Array<{ id: string; title: string; trl: number }>;
  stratDiffs?: Array<{ title: string }>;
  robustScore?: { direction: number; logic: number; execution: number; baseline: number; doctrine: number; learning: number };
  gateItems?: Array<{ gate: string; status: string; note: string }>;
  capacity?: { utilizationPct?: number; gapUnits?: number };
}

export interface AgentPrompt {
  system: string;
  user: (ctx: AgentContext) => string;
}

function safeJson(v: unknown): string {
  try {
    return JSON.stringify(v ?? null);
  } catch {
    return "null";
  }
}

export const AGENT_PROMPTS: Record<string, AgentPrompt> = {
  a01: {
    system:
      "You are StratOS ReportIngest agent. Normalize and summarize the incoming report. " +
      "Return JSON: { output: string[], status: 'done'|'skipped' }. " +
      "output: 2-4 bullet points — line count, encoding, key sections detected, any parse issues.",
    user: (ctx) =>
      JSON.stringify({
        reportId: ctx.reportId,
        lineCount: ctx.rawContent.split("\n").length,
        excerpt: ctx.rawContent.slice(0, 2000),
        mckinseyDetected: Boolean(ctx.parsed.mckinsey),
      }),
  },
  a02: {
    system:
      "You are StratOS MintzbergScanner agent. Identify strategic formation patterns " +
      "(emergent, serendipitous, unrealized, deliberate) from the report. " +
      "Return JSON: { output: string[], status: 'done'|'skipped' }. " +
      "output: one bullet per pattern — 'type: title (suggestDeliberate: yes/no)'.",
    user: (ctx) =>
      JSON.stringify({
        patterns: ctx.parsed.patterns.map((p) => ({
          formationType: p.formationType,
          title: p.title,
          suggestDeliberate: p.suggestDeliberate,
        })),
        excerpt: ctx.rawContent.slice(0, 3000),
      }),
  },
  a03: {
    system:
      "You are StratOS CoverageExtractor agent. Extract GtmStack coverage updates from the report. " +
      "Return JSON: { output: string[], status: 'done'|'skipped' }. " +
      "output: coverage lines with actual/target counts per segment.",
    user: (ctx) =>
      JSON.stringify({
        coverageUpdates: ctx.parsed.coverageUpdates,
        excerpt: ctx.rawContent.slice(0, 2000),
      }),
  },
  a04: {
    system:
      "You are StratOS HealthAssertion agent. Check for hard-block triggers " +
      "(runway < 3 months, compliance violations, major incidents). " +
      "Return JSON: { output: string[], status: 'done'|'skipped' }. " +
      "output: each trigger as 'metric: value — threshold breached'. Empty array if none.",
    user: (ctx) =>
      JSON.stringify({
        assertionTriggers: ctx.parsed.assertionTriggers,
        runway: ctx.fpa?.cashRunwayMonths,
        healthScore: ctx.healthOverview?.score,
        kpis: ctx.healthOverview?.kpis,
      }),
  },
  a05: {
    system:
      "You are StratOS FpaReconciler agent. Reconcile B-A-F (Budget-Actual-Forecast) " +
      "and check budget_tag linkage to three stacks. " +
      "Return JSON: { output: string[], status: 'done'|'skipped' }. " +
      "output: revenue/profit F vs B, runway months, budget_tag status.",
    user: (ctx) =>
      JSON.stringify({
        fpa: ctx.fpa,
        capacity: ctx.capacity,
      }),
  },
  a06: {
    system:
      "You are StratOS StratDiffAnalyst agent. Analyze top strategic diffs between snapshots. " +
      "Return JSON: { output: string[], status: 'done'|'skipped' }. " +
      "output: top 3-5 diff titles with brief impact notes.",
    user: (ctx) => safeJson({ stratDiffs: ctx.stratDiffs ?? [] }),
  },
  a07: {
    system:
      "You are StratOS GateAuditor agent. Audit Invest/Innovate/Deliver gates " +
      "and produce a risk checklist (not a score). " +
      "Return JSON: { output: string[], status: 'done'|'skipped' }. " +
      "output: gate items with status (green/yellow/red) and risk note.",
    user: (ctx) => safeJson({ gateItems: ctx.gateItems ?? [] }),
  },
  a08: {
    system:
      "You are StratOS SpbpForecaster agent. Apply Bayesian nudge to scenario probabilities " +
      "based on report evidence. " +
      "Return JSON: { output: string[], status: 'done'|'skipped' }. " +
      "output: each scenario as 'name: probability% — direction (up/down/unchanged)'.",
    user: (ctx) =>
      JSON.stringify({
        scenarios: ctx.spbpScenarios,
        evidence: {
          favorsPessimistic: ctx.parsed.assertionTriggers.length > 0,
          assertionCount: ctx.parsed.assertionTriggers.length,
        },
      }),
  },
  a09: {
    system:
      "You are StratOS TechSignalScanner agent. Scan technology signals and TRL levels. " +
      "Return JSON: { output: string[], status: 'done'|'skipped' }. " +
      "output: each signal as 'TRL{n} {title} — urgency: watch/act/invest'.",
    user: (ctx) => safeJson({ techSignals: ctx.techSignals ?? [] }),
  },
  a10: {
    system:
      "You are StratOS RobustScorer agent. Compute R1-R6 weighted robustness score. " +
      "Return JSON: { output: string[], status: 'done'|'skipped' }. " +
      "output: 'overall: {score}' + per-dimension one-liners if data available.",
    user: (ctx) => safeJson({ robustScore: ctx.robustScore ?? {} }),
  },
  a11: {
    system:
      "You are StratOS SnapshotAdvisor agent. Produce a pre-freeze checklist for the CEO. " +
      "Return JSON: { output: string[], status: 'done'|'skipped' }. " +
      "output: checklist items — blockers first, then confirmations.",
    user: (ctx) =>
      JSON.stringify({
        assertionTriggers: ctx.parsed.assertionTriggers,
        healthScore: ctx.healthOverview?.score,
        capacity: ctx.capacity,
      }),
  },
};

export function getAgentPrompt(agent: StratAgent): AgentPrompt | undefined {
  return AGENT_PROMPTS[agent.id];
}
