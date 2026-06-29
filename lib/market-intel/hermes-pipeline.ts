/**
 * Hermes multi-agent pipeline · collect → analyze → qc → decide
 *
 * Borrows the RivalRadar closed-loop pattern: each extracted signal must be
 * grounded in a verbatim quote from the source text. The curator (qc) node
 * verifies grounding deterministically and assigns a three-state verdict.
 * Unsupported signals are DROPPED and recorded in `drops` (transparency, not
 * silent deletion) — this is the anti-hallucination gate the board relies on.
 *
 * The LLM only runs in the `analyze` node (extraction). qc + decide are
 * deterministic, so the grounding guarantee holds even with a noisy model and
 * is fully unit-testable without network or API keys.
 */
import type {
  CurationDrop,
  HermesNodeTrace,
  HermesPipelineResult,
  IntelSignal,
  IntelSource,
  SupportVerdict,
} from "./types";
import { extractWithLlm, fetchPlainText, hermesLlmConfigured } from "./hermes-llm";

/** Normalize text for fuzzy quote matching: lowercase, collapse whitespace, strip punctuation noise. */
export function normalizeForMatch(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\s\u3000]+/g, "")
    .replace(/[，。、；：「」“”"'（）()\[\]【】!！?？.,;:]/g, "");
}

/**
 * Longest common substring ratio of `needle` found in `haystack`, 0..1.
 * Used to tolerate minor LLM transcription drift while still requiring the
 * quote to be substantially present in the source.
 */
export function quoteCoverage(needle: string, haystack: string): number {
  const n = normalizeForMatch(needle);
  const h = normalizeForMatch(haystack);
  if (!n) return 0;
  if (h.includes(n)) return 1;
  // sliding longest-run match
  let best = 0;
  const win = Math.max(8, Math.floor(n.length * 0.6));
  for (let i = 0; i + win <= n.length; i++) {
    if (h.includes(n.slice(i, i + win))) {
      best = Math.max(best, win / n.length);
    }
  }
  return best;
}

/**
 * QC / curator node. Deterministic grounding verdict for one signal.
 * Requires an evidence quote that is substantially present in source text.
 */
export function gradeSignal(signal: IntelSignal, sourceText: string): SupportVerdict {
  if (!signal.evidence || !signal.evidence.trim()) return "unsupported";
  const cov = quoteCoverage(signal.evidence, sourceText);
  if (cov >= 0.95) return "supported";
  if (cov >= 0.6) return "partial";
  return "unsupported";
}

export interface CuratedBatch {
  kept: IntelSignal[];
  drops: CurationDrop[];
  trace: HermesNodeTrace[];
}

/**
 * Curate a batch of extracted signals against the source text they came from.
 * Pure function — the testable heart of the anti-hallucination gate.
 */
export function curateSignals(
  competitor: string,
  signals: IntelSignal[],
  sourceText: string,
): CuratedBatch {
  const kept: IntelSignal[] = [];
  const drops: CurationDrop[] = [];
  for (const sig of signals) {
    const verdict = gradeSignal(sig, sourceText);
    if (verdict === "unsupported") {
      drops.push({
        competitor,
        dimension: sig.dimension,
        title: sig.title,
        reason: sig.evidence ? "证据引文未在原文中找到" : "缺少原文佐证引文",
      });
      continue;
    }
    kept.push({ ...sig, verdict });
  }
  const trace: HermesNodeTrace[] = [
    {
      node: "qc",
      competitor,
      detail: `校验 ${signals.length} 条 → 保留 ${kept.length}（佐证 ${
        kept.filter((s) => s.verdict === "supported").length
      } · 部分 ${kept.filter((s) => s.verdict === "partial").length}）· 丢弃 ${drops.length}`,
    },
  ];
  return { kept, drops, trace };
}

/** Coverage = share of dimensions (product/gtm/brand/strategy) with at least one kept signal. */
export function dimensionCoverage(signals: IntelSignal[]): number {
  const dims = new Set(signals.map((s) => s.dimension));
  return dims.size / 4;
}

function daysSince(iso: string | null, now: Date): number {
  if (!iso) return Infinity;
  return Math.floor((now.getTime() - new Date(iso).getTime()) / 86_400_000);
}

export interface PipelineOptions {
  /** Max closed-loop rounds (re-collect when coverage is low). */
  maxRounds?: number;
  /** Coverage threshold below which a re-collect round is triggered. */
  coverageFloor?: number;
  now?: Date;
}

/**
 * Run the full pipeline over due sources. Network + LLM live here; the
 * grounding guarantee is enforced by the deterministic curator regardless.
 */
export async function runHermesPipeline(
  sources: IntelSource[],
  opts: PipelineOptions = {},
): Promise<HermesPipelineResult> {
  const now = opts.now ?? new Date();
  const maxRounds = opts.maxRounds ?? 2;
  const coverageFloor = opts.coverageFloor ?? 0.5;
  const capturedAt = now.toISOString().slice(0, 10);

  const trace: HermesNodeTrace[] = [];
  const kept: IntelSignal[] = [];
  const drops: CurationDrop[] = [];
  const llm = hermesLlmConfigured();

  const due = sources.filter(
    (s) => s.url && daysSince(s.lastScrapedAt, now) >= s.cadenceDays,
  );
  const active = sources.filter((s) => daysSince(s.lastScrapedAt, now) <= s.cadenceDays * 2).length;

  const dueWithoutUrl = sources.filter(
    (s) => !s.url && daysSince(s.lastScrapedAt, now) >= s.cadenceDays,
  );
  for (const source of dueWithoutUrl) {
    trace.push({ node: "collect", competitor: source.competitor, detail: "来源未配置 URL · 无信息更新", fetched: false });
  }
  if (due.length === 0 && dueWithoutUrl.length === 0) {
    trace.push({ node: "collect", competitor: "—", detail: "无到期来源 · 本次无信息更新", fetched: false });
  }

  let rounds = 0;
  for (const source of due) {
    rounds = Math.max(rounds, 1);
    // ── collect ──
    const text = await fetchPlainText(source.url!);
    if (!text) {
      trace.push({ node: "collect", competitor: source.competitor, detail: "来源读取失败 · 无信息更新", fetched: false });
      continue;
    }
    trace.push({ node: "collect", competitor: source.competitor, detail: `读取 ${text.length} 字`, fetched: true });

    // ── analyze ──
    const sourceLabel = `${source.competitor} ${source.kind} ${capturedAt}`;
    let extracted = await extractWithLlm(
      source.competitor, sourceLabel, text, capturedAt, source.id, source.kind,
    );
    trace.push({ node: "analyze", competitor: source.competitor, detail: `抽取 ${extracted.length} 条候选信号` });

    // ── qc ── (deterministic grounding)
    let batch = curateSignals(source.competitor, extracted, text);
    trace.push(...batch.trace);

    // ── closed loop: re-collect once if coverage is thin and we have budget ──
    let round = 1;
    while (
      llm &&
      round < maxRounds &&
      dimensionCoverage(batch.kept) < coverageFloor &&
      extracted.length > 0
    ) {
      round++;
      rounds = Math.max(rounds, round);
      extracted = await extractWithLlm(
        source.competitor, sourceLabel, text, capturedAt, `${source.id}-r${round}`, source.kind,
      );
      const re = curateSignals(source.competitor, extracted, text);
      trace.push({
        node: "qc",
        competitor: source.competitor,
        detail: `第 ${round} 轮复采 · 覆盖不足重抽`,
      });
      if (re.kept.length > batch.kept.length) batch = re;
    }

    kept.push(...batch.kept);
    drops.push(...batch.drops);
  }

  // ── decide ── synthesize a coverage verdict for the board
  const cov = dimensionCoverage(kept);
  trace.push({
    node: "decide",
    competitor: "—",
    detail: `维度覆盖 ${Math.round(cov * 100)}% · 保留 ${kept.length} · 丢弃 ${drops.length}`,
  });

  return {
    scanId: `hermes-${capturedAt}`,
    ranAt: now.toISOString(),
    sourcesScanned: sources.length,
    sourcesActive: active,
    kept,
    drops,
    trace,
    rounds,
    llmEngine: llm ? "llm" : "rule",
  };
}
