/**
 * Hermes real fetch layer.
 * Fetch → strip HTML → LLM extract → IntelSignal[]
 * Falls back gracefully when LLM key absent or fetch fails.
 */
import type { IntelSignal, IntelSource } from "./types";
import { llmConfigured, wrapUntrustedExternal } from "@/lib/ai/llm-config";
import { askTandem } from "@/lib/ai/tandem-brain";

export function hermesLlmConfigured(): boolean {
  return llmConfigured();
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
  if (!llmConfigured()) return [];

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
    // 外部抓取的竞品网页原文 = 不可信输入，中和 + 显式边界后再喂模型（堵间接注入）。
    // 经 tandem-brain 收口：开关开→Tandem 受治理 AI，关→fail-soft 直连。
    const res = await askTandem({
      scenario: "tool_use",
      purpose: "competitive-intel-extraction",
      system,
      user: wrapUntrustedExternal(text, 5000),
      temperature: 0,
      responseJson: true,
      timeoutMs: 30_000,
    });
    if (!res.ok || !res.content) return [];
    let parsed: unknown;
    try { parsed = JSON.parse(res.content); } catch { return []; }
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
