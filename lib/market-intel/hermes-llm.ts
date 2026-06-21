/**
 * Hermes real fetch layer.
 * Fetch → strip HTML → LLM extract → IntelSignal[]
 * Falls back gracefully when LLM key absent or fetch fails.
 */
import type { IntelSignal, IntelSource } from "./types";

function llmKey(): string | undefined {
  return process.env.OPENAI_API_KEY ?? process.env.STRATOS_LLM_API_KEY;
}
function llmBaseUrl(): string {
  return (process.env.STRATOS_LLM_BASE_URL ?? process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, "");
}
function llmModel(): string {
  return process.env.STRATOS_LLM_MODEL ?? "gpt-4o-mini";
}

export function hermesLlmConfigured(): boolean {
  return Boolean(llmKey());
}

export async function fetchPlainText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; StratOS-Hermes/1.0)" },
    });
    if (!res.ok) return null;
    const html = await res.text();
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/\s{2,}/g, " ")
      .trim()
      .slice(0, 6000) || null;
  } catch {
    return null;
  }
}

interface RawSignal {
  dimension?: unknown;
  title?: unknown;
  summary?: unknown;
  impact?: unknown;
  relevance?: unknown;
  evidence?: unknown;
}

export async function extractWithLlm(
  competitor: string,
  sourceLabel: string,
  text: string,
  capturedAt: string,
  sourceId: string,
  sourceKind: IntelSource["kind"],
): Promise<IntelSignal[]> {
  if (!llmKey()) return [];

  const system = [
    "You are Hermes, competitive intelligence agent for Rheem China (HVAC heat pump / water heater).",
    "Extract moves from web page text. Return ONLY a JSON object: { \"signals\": [...] }",
    "Each signal: dimension (product|gtm|brand|strategy), title (Chinese, <=60 chars),",
    "summary (Chinese, 2-3 sentences), impact (threat|opportunity|neutral), relevance 0-100.",
    "Also include `evidence`: a SHORT verbatim quote (<=160 chars) copied EXACTLY from the source text",
    "that backs the claim. Do NOT paraphrase the evidence. If you cannot quote source text, omit the signal.",
    "Return { \"signals\": [] } if nothing actionable. No markdown.",
    "Competitor: " + competitor + "  Date: " + capturedAt,
  ].join("\n");

  try {
    const res = await fetch(llmBaseUrl() + "/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(30_000),
      headers: { Authorization: "Bearer " + llmKey(), "Content-Type": "application/json" },
      body: JSON.stringify({
        model: llmModel(),
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: text.slice(0, 5000) },
        ],
      }),
    });
    if (!res.ok) return [];
    const json = await res.json() as { choices?: { message?: { content?: string } }[] };
    const raw = json.choices?.[0]?.message?.content ?? "{}";
    let parsed: unknown;
    try { parsed = JSON.parse(raw); } catch { return []; }
    const arr: RawSignal[] = Array.isArray(parsed)
      ? parsed
      : Array.isArray((parsed as Record<string, unknown>).signals)
        ? (parsed as Record<string, unknown>).signals as RawSignal[]
        : [];

    const DIMS = ["product", "gtm", "brand", "strategy"];
    const IMPACTS = ["threat", "opportunity", "neutral"];
    return arr
      .filter((s) => DIMS.includes(String(s.dimension)) && IMPACTS.includes(String(s.impact)) && s.title && s.summary)
      .map((s, i) => ({
        id: "hermes-" + sourceId + "-" + capturedAt + "-" + i,
        competitor,
        dimension: s.dimension as IntelSignal["dimension"],
        title: String(s.title).slice(0, 60),
        summary: String(s.summary).slice(0, 800),
        impact: s.impact as IntelSignal["impact"],
        relevance: Math.min(100, Math.max(0, Math.round(Number(s.relevance)))),
        sourceKind,
        sourceLabel,
        capturedAt,
        evidence: s.evidence ? String(s.evidence).slice(0, 200) : undefined,
      }));
  } catch {
    return [];
  }
}

export interface HermesFetchResult {
  sourceId: string;
  competitor: string;
  newSignals: IntelSignal[];
  fetched: boolean;
  error?: string;
}

export async function scanSource(source: IntelSource, now = new Date()): Promise<HermesFetchResult> {
  const capturedAt = now.toISOString().slice(0, 10);
  const base: HermesFetchResult = { sourceId: source.id, competitor: source.competitor, newSignals: [], fetched: false };

  if (!source.url) return { ...base, error: "URL 未配置" };
  if (!hermesLlmConfigured()) return { ...base, error: "LLM 未配置，使用规则引擎" };

  const text = await fetchPlainText(source.url);
  if (!text) return { ...base, error: "抓取失败" };

  const sourceLabel = source.competitor + " " + source.kind + " " + capturedAt;
  const signals = await extractWithLlm(source.competitor, sourceLabel, text, capturedAt, source.id, source.kind);
  return { sourceId: source.id, competitor: source.competitor, newSignals: signals, fetched: true };
}
