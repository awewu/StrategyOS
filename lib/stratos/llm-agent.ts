/**
 * Optional LLM layer for report parsing — OpenAI-compatible API.
 * Falls back to null when no API key; caller uses rule-based parser.
 */
import type { ReportPattern, StrategyFormationType } from "@/lib/types/stratos";
import type { ParsedReport } from "./report-agent";

export function llmConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY || process.env.STRATOS_LLM_API_KEY);
}

function apiKey(): string | undefined {
  return process.env.OPENAI_API_KEY ?? process.env.STRATOS_LLM_API_KEY;
}

function baseUrl(): string {
  return (
    process.env.STRATOS_LLM_BASE_URL ??
    process.env.OPENAI_BASE_URL ??
    "https://api.openai.com/v1"
  ).replace(/\/$/, "");
}

function model(): string {
  return process.env.STRATOS_LLM_MODEL ?? "gpt-4o-mini";
}

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
    const res = await fetch(`${baseUrl()}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model(),
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: rawContent.slice(0, 12000) },
        ],
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const payload = JSON.parse(content) as LlmPayload;
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
