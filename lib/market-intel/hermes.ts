/**
 * Hermes —— 市场洞察常驻智能体。
 *
 * 职责：按 cadence 扫描已登记来源 → 抓取竞品动态 → 归一化为信号 →
 * 评估对我方战略的影响 → 输出扫描结果与高相关摘要。
 *
 * MVP 为规则引擎；接入 LLM 后由 runHermesScanSmart 走真实抓取+分析。
 * 与 STRAT_AGENTS 注册表保持同构（id/name/role/handler）。
 */
import {
  DIMENSION_LABEL,
  IMPACT_LABEL,
  SOURCE_LABEL,
  type HermesScanResult,
  type IntelSignal,
  type IntelSource,
} from "./types";
import { demoSignals, demoSources } from "./demo-data";

export const HERMES = {
  id: "hermes",
  name: "Hermes",
  role: "市场洞察常驻智能体 · 产品/GTM/品牌/战略模式持续追踪",
  handler: "market_intel" as const,
  /** 默认扫描节奏（天） */
  defaultCadenceDays: 7,
};

function daysSince(iso: string | null, now: Date): number {
  if (!iso) return Infinity;
  const then = new Date(iso).getTime();
  return Math.floor((now.getTime() - then) / 86_400_000);
}

/** 来源是否到期需要重新抓取 */
export function isSourceDue(source: IntelSource, now = new Date()): boolean {
  return daysSince(source.lastScrapedAt, now) >= source.cadenceDays;
}

/** 评估来源健康度 */
export function sourceHealth(source: IntelSource, now = new Date()): IntelSource["health"] {
  if (!source.lastScrapedAt) return "empty";
  return daysSince(source.lastScrapedAt, now) > source.cadenceDays * 2 ? "stale" : "active";
}

/** 盲区清单：从未抓到数据或长期超期的来源 */
export function blindSpots(sources: IntelSource[], now = new Date()): string[] {
  return sources
    .filter((s) => sourceHealth(s, now) !== "active")
    .map((s) => `${s.competitor} · ${SOURCE_LABEL[s.kind]}（${sourceHealth(s, now) === "empty" ? "从未抓到" : "数据超期"}）`);
}

/** 高相关信号排序（relevance 降序，威胁优先） */
export function rankSignals(signals: IntelSignal[]): IntelSignal[] {
  const impactWeight = { threat: 2, opportunity: 1, neutral: 0 };
  return [...signals].sort(
    (a, b) =>
      b.relevance - a.relevance ||
      impactWeight[b.impact] - impactWeight[a.impact]
  );
}

/**
 * 运行一次 Hermes 扫描（规则引擎）。
 * 真实部署时 fetcher 替换为抓取器；此处基于 demo 来源模拟。
 */
export function runHermesScan(
  sources: IntelSource[] = demoSources,
  signals: IntelSignal[] = demoSignals,
  now = new Date()
): HermesScanResult {
  const log: string[] = [];
  let active = 0;

  for (const s of sources) {
    const health = sourceHealth(s, now);
    if (health === "active") active += 1;
    const due = isSourceDue(s, now);
    const status =
      health === "empty"
        ? "盲区 · 无数据"
        : due
          ? "到期 · 已重抓"
          : "新鲜 · 跳过";
    log.push(`${s.competitor} · ${SOURCE_LABEL[s.kind]} → ${status}`);
  }

  const ranked = rankSignals(signals);
  const highlights = ranked
    .slice(0, 3)
    .map(
      (sig) =>
        `[${IMPACT_LABEL[sig.impact]} ${sig.relevance}] ${sig.competitor} · ${DIMENSION_LABEL[sig.dimension]}：${sig.title}`
    );

  return {
    scanId: `hermes-${now.toISOString().slice(0, 10)}`,
    ranAt: now.toISOString(),
    sourcesScanned: sources.length,
    sourcesActive: active,
    newSignals: signals.length,
    log,
    highlights,
    llmEngine: "rule",
  };
}
