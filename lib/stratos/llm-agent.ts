/**
 * Optional LLM layer for report parsing — OpenAI-compatible API.
 * Falls back to null when no API key; caller uses rule-based parser.
 */
import type { ReportPattern, StrategyFormationType } from "@/lib/types/stratos";
import type { ParsedReport } from "./report-agent";
import { llmConfigured, llmModel as model } from "@/lib/ai/llm-config";
import { askTandem } from "@/lib/ai/tandem-brain";

export { llmConfigured };

interface LlmPayload {
  patterns: Array<{
    formationType: StrategyFormationType;
    title: string;
    suggestDeliberate?: boolean;
  }>;
  coverageUpdates: string[];
  assertionTriggers: string[];
  summary?: string;
}

export async function parseReportWithLlm(
  reportId: string,
  rawContent: string,
  period: string
): Promise<ParsedReport | null> {
  if (!llmConfigured()) return null;

  const system = `You are StratOS Report Agent for Rheem China strategy reports.
Extract JSON only:
- patterns: Mintzberg §8 items (formationType: emergent|serendipitous|unrealized|deliberate, title, suggestDeliberate boolean)
- coverageUpdates: GtmStack coverage lines
- assertionTriggers: health hard blocks e.g. runway < 3 months
- summary: one sentence CEO brief
Period: ${period}. Report id: ${reportId}.`;

  try {
    const res = await askTandem({
      scenario: "long_context",
      purpose: "report-parse",
      system,
      user: rawContent.slice(0, 12000),
      temperature: 0.2,
      responseJson: true,
      timeoutMs: 8000,
    });
    if (!res.ok || !res.content) return null;

    const payload = JSON.parse(res.content) as LlmPayload;
    const patterns: ReportPattern[] = (payload.patterns ?? []).map((p) => ({
      formationType: p.formationType,
      title: p.title,
      linkedOkr: [],
      suggestDeliberate: p.suggestDeliberate,
      reportId,
    }));

    return {
      reportId,
      status: "parsed",
      patterns,
      coverageUpdates: payload.coverageUpdates ?? [],
      assertionTriggers: payload.assertionTriggers ?? [],
      agentTrace: [
        "Agent:LLM → " + model(),
        payload.summary ? `summary: ${payload.summary}` : "LLM parse ok",
      ],
    };
  } catch {
    return null;
  }
}

export async function parseReportSmart(
  reportId: string,
  rawContent: string,
  period: string,
  preferLlm = true
): Promise<{ parsed: ParsedReport; engine: "llm" | "rules" }> {
  if (preferLlm && llmConfigured()) {
    const llm = await parseReportWithLlm(reportId, rawContent, period);
    if (llm) return { parsed: llm, engine: "llm" };
  }
  const { parseReportContent } = await import("./report-agent");
  return { parsed: parseReportContent(reportId, rawContent, period), engine: "rules" };
}
