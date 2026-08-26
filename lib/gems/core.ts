/**
 * Gems 引擎共享工具 — 排序 / 计数 / 组装 / 动作重定向。
 * 所有角色 Gem 复用同一套原语, 保证洞察卡形态与优先级一致。
 */
import type { GemInsightResult, GemMetric, InsightCard, InsightKind, InsightSeverity } from "./types";

export const SEV_RANK: Record<InsightSeverity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
  info: 0,
};

export const KIND_RANK: Record<InsightKind, number> = {
  risk: 0,
  change: 1,
  advice: 2,
  todo: 3,
};

export function num(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

/** 风险 > 变化 > 建议 > 待办; 同类按严重度降序。 */
export function sortCards(cards: InsightCard[]): InsightCard[] {
  return cards
    .slice()
    .sort((a, b) => KIND_RANK[a.kind] - KIND_RANK[b.kind] || SEV_RANK[b.severity] - SEV_RANK[a.severity]);
}

export function countCards(cards: InsightCard[]): Record<InsightKind, number> {
  return {
    risk: cards.filter((c) => c.kind === "risk").length,
    change: cards.filter((c) => c.kind === "change").length,
    advice: cards.filter((c) => c.kind === "advice").length,
    todo: cards.filter((c) => c.kind === "todo").length,
  };
}

/** 把一批卡的下钻动作统一重定向(用于 board/observer 等受限视界)。 */
export function retargetActions(
  cards: InsightCard[],
  action: { href: string; label: string },
): InsightCard[] {
  return cards.map((c) => ({ ...c, action: { ...action } }));
}

export function assembleResult(opts: {
  gem: string;
  persona: string;
  tagline: string;
  period: string;
  generatedAt?: string;
  headline: string;
  stance?: string;
  cards: InsightCard[];
  metrics?: GemMetric[];
  drops: number;
  dataSource: string;
}): GemInsightResult {
  const cards = sortCards(opts.cards);
  return {
    gem: opts.gem,
    persona: opts.persona,
    tagline: opts.tagline,
    period: opts.period,
    generatedAt: opts.generatedAt ?? new Date().toISOString(),
    headline: opts.headline,
    stance: opts.stance,
    cards,
    metrics: opts.metrics ?? [],
    counts: countCards(cards),
    drops: opts.drops,
    dataSource: opts.dataSource,
  };
}
