/**
 * 各角色 Gem 构建器 — 每个角色显式声明自己的真实数据源, 保证不越权、不臆造。
 *
 * 数据分层(诚实):
 *  · 战略真值 (ceo/cfo/board/observer) → buildStrategyDigest() 公司级合理性传感器
 *  · 执行真值 (vp/system_head/pm)       → getCommitmentRecords() 按 org/project 作用域过滤
 *  · 报告真值 (staff)                    → listReports() 按 org 作用域
 *  · 系统真值 (admin)                    → buildHealthPayload()
 */
import { buildStrategyDigest } from "@/lib/stratos/strategy-digest";
import { getActivePeriod } from "@/lib/data/active-period";
import { getCommitmentRecords } from "@/lib/data/strategy-data";
import { buildHealthPayload } from "@/lib/health/payload";
import { listReports } from "@/lib/reports/report-queries";
import { getSliceByIdGlobal, filterBySlice } from "@/lib/monitor/org-slices";
import { orgScopeWhere } from "@/lib/auth/scope";
import type { CommitmentRecord } from "@/lib/execution/tension-analysis";
import type { GemBuildContext, GemInsightResult, InsightCard } from "./types";
import { assembleResult, num, retargetActions } from "./core";
import {
  bafGapCard,
  commitmentCards,
  fetchOverallVerdict,
  freezeReadyCard,
  healthCards,
  reportGapCards,
  strategyCards,
} from "./lenses";

const MAX_REPORT_SCAN = 50;

const COMMITMENT_SLICE_GETTERS = [
  (c: CommitmentRecord) => c.department,
  (c: CommitmentRecord) => c.owner,
  (c: CommitmentRecord) => c.content,
  (c: CommitmentRecord) => c.linkedProjectCode,
];

// ─────────────────────────── CEO 帅 ───────────────────────────
export async function buildCeoGem(_ctx?: GemBuildContext): Promise<GemInsightResult> {
  const [digest, period] = await Promise.all([buildStrategyDigest(), getActivePeriod()]);
  const { cards, drops } = strategyCards(digest);
  let stance: string | undefined;

  const verdict = await fetchOverallVerdict(period);
  if (verdict) {
    cards.push(verdict.card);
    stance = verdict.stance;
  }
  if (!cards.some((c) => c.kind === "risk") && digest.hardBlocks.length === 0) {
    cards.push(freezeReadyCard(digest));
  }

  return assembleResult({
    gem: "ceo",
    persona: "帅",
    tagline: "全局战略参谋",
    period,
    generatedAt: digest.generatedAt,
    headline:
      `脆弱前提 ${digest.counts.fragilePremises} · 硬阻断 ${digest.counts.hardBlocks} · ` +
      `runway ${num(digest.fpa.cashRunwayMonths)} 月 · Bet ${digest.counts.bets}`,
    stance,
    cards,
    drops,
    dataSource: digest.dataSource,
  });
}

// ─────────────────────────── CFO algak ───────────────────────────
export async function buildCfoGem(_ctx?: GemBuildContext): Promise<GemInsightResult> {
  const [digest, period] = await Promise.all([buildStrategyDigest(), getActivePeriod()]);
  const { cards, drops } = strategyCards(digest, ["hardblock", "runway", "bet"]);

  const baf = bafGapCard(digest);
  if (baf) cards.push(baf);

  const verdict = await fetchOverallVerdict(period);
  if (verdict) cards.push(verdict.card);

  return assembleResult({
    gem: "cfo",
    persona: "algak",
    tagline: "财务审计官",
    period,
    generatedAt: digest.generatedAt,
    headline:
      `runway ${num(digest.fpa.cashRunwayMonths)} 月 · 预算 ${num(digest.fpa.revenueBudget)} → ` +
      `预测 ${num(digest.fpa.revenueForecast)} · Bet ${digest.counts.bets}`,
    stance: verdict?.stance,
    cards,
    drops,
    dataSource: digest.dataSource,
  });
}

// ─────────────────────────── 董事会 观澜 ───────────────────────────
export async function buildBoardGem(_ctx?: GemBuildContext): Promise<GemInsightResult> {
  const [digest, period] = await Promise.all([buildStrategyDigest(), getActivePeriod()]);
  const { cards, drops } = strategyCards(digest, ["hardblock", "diff"]);
  let stance: string | undefined;

  const verdict = await fetchOverallVerdict(period);
  if (verdict) {
    cards.push(verdict.card);
    stance = verdict.stance;
  }

  // 董事视界硬白名单: 只放行 /board, 全部下钻重定向到董事会包
  const scoped = retargetActions(cards, { href: "/board", label: "董事会包" });

  return assembleResult({
    gem: "board",
    persona: "观澜",
    tagline: "治理观察",
    period,
    generatedAt: digest.generatedAt,
    headline: `硬阻断 ${digest.counts.hardBlocks} · 重大变化 ${digest.topDiffs.length} · 整体研判 ${stance ?? "待生成"}`,
    stance,
    cards: scoped,
    drops,
    dataSource: digest.dataSource,
  });
}

// ─────────────────────────── observer 览 ───────────────────────────
export async function buildObserverGem(_ctx?: GemBuildContext): Promise<GemInsightResult> {
  const [digest, period] = await Promise.all([buildStrategyDigest(), getActivePeriod()]);
  const { cards, drops } = strategyCards(digest, ["diff"]);
  let stance: string | undefined;

  const verdict = await fetchOverallVerdict(period);
  if (verdict) {
    cards.push(verdict.card);
    stance = verdict.stance;
  }

  const scoped = retargetActions(cards, { href: "/strategy", label: "战略一页纸" });

  return assembleResult({
    gem: "observer",
    persona: "览",
    tagline: "只读向导",
    period,
    generatedAt: digest.generatedAt,
    headline: `战略诊断 crux: ${digest.diagnosis.crux || "—"}`,
    stance,
    cards: scoped,
    drops,
    dataSource: digest.dataSource,
  });
}

// ─────────────── 承诺兑现型 (vp/system_head/pm 共用) ───────────────
async function buildCommitmentGem(
  ctx: GemBuildContext,
  meta: { gem: string; persona: string; tagline: string },
): Promise<GemInsightResult> {
  const [all, period] = await Promise.all([getCommitmentRecords(), getActivePeriod()]);

  let records: CommitmentRecord[] = all;
  let scopeLabel = "集团全览";
  const drillHref = ctx.role === "pm" ? "/execution" : "/cockpit";

  if (ctx.role === "pm") {
    const name = ctx.session?.name ?? "";
    const projects = ctx.projectScope ?? [];
    records = all.filter(
      (r) =>
        (name && r.owner === name) ||
        (r.linkedProjectCode ? projects.includes(r.linkedProjectCode) : false),
    );
    scopeLabel = name ? `我的承诺 · ${name}` : "我的承诺";
  } else if (ctx.orgScope && ctx.orgScope.length > 0) {
    const resolved = getSliceByIdGlobal(ctx.orgScope[0]);
    if (resolved) {
      records = filterBySlice(all, resolved.slice, COMMITMENT_SLICE_GETTERS);
      scopeLabel = resolved.slice.label;
    }
  }

  const { cards, drops } = commitmentCards(records, { scopeLabel, drillHref });

  return assembleResult({
    gem: meta.gem,
    persona: meta.persona,
    tagline: meta.tagline,
    period,
    headline: `${scopeLabel} · 承诺 ${records.length} 项`,
    cards,
    drops,
    dataSource: "database",
  });
}

// ─────────────────────────── staff 策 ───────────────────────────
export async function buildStaffGem(ctx: GemBuildContext): Promise<GemInsightResult> {
  const [digest, period, reports] = await Promise.all([
    buildStrategyDigest(),
    getActivePeriod(),
    listReports({ filters: {}, pageSize: MAX_REPORT_SCAN, scopeWhere: orgScopeWhere(ctx.orgScope) }).catch(
      () => null,
    ),
  ]);

  const cards: InsightCard[] = [];
  let drops = 0;

  if (reports) {
    const gaps = reportGapCards(reports.rows);
    cards.push(...gaps.cards);
    drops += gaps.drops;
  }
  // 版本变化待归因
  const diff = strategyCards(digest, ["diff"]);
  cards.push(...diff.cards);
  drops += diff.drops;

  return assembleResult({
    gem: "staff",
    persona: "策",
    tagline: "战略幕僚",
    period,
    generatedAt: digest.generatedAt,
    headline: reports
      ? `报告 ${reports.pagination.total} 份 · 待处置 ${cards.filter((c) => c.kind === "todo").length} 项`
      : `版本变化 ${diff.cards.length} 项待归因`,
    cards,
    drops,
    dataSource: digest.dataSource,
  });
}

// ─────────────────────────── admin 枢 ───────────────────────────
export async function buildAdminGem(_ctx?: GemBuildContext): Promise<GemInsightResult> {
  const [payload, period] = await Promise.all([buildHealthPayload(), getActivePeriod()]);
  const { cards, drops } = healthCards(payload);

  return assembleResult({
    gem: "admin",
    persona: "枢",
    tagline: "系统审计",
    period,
    headline: `状态 ${payload.status.toUpperCase()} · mode ${payload.mode} · dataSource ${payload.dataSource}`,
    cards,
    drops,
    dataSource: payload.dataSource,
  });
}

export function buildVpGem(ctx: GemBuildContext): Promise<GemInsightResult> {
  return buildCommitmentGem(ctx, { gem: "vp", persona: "拿云", tagline: "事业部教练" });
}

export function buildSystemHeadGem(ctx: GemBuildContext): Promise<GemInsightResult> {
  return buildCommitmentGem(ctx, { gem: "system_head", persona: "执衡", tagline: "职能负责" });
}

export function buildPmGem(ctx: GemBuildContext): Promise<GemInsightResult> {
  return buildCommitmentGem(ctx, { gem: "pm", persona: "匠", tagline: "执行搭子" });
}
