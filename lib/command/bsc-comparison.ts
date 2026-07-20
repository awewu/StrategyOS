/**
 * 指挥舱 · BSC 目标 vs 实际 对比引擎（纯函数 · 可单测 · 无网络/DB）。
 *
 * 治理铁律（务必区分，绝不混淆）：
 *  - 红线（threshold / mustNotFail）＝ 年度经营管理底线 KPI。突破即预警/叫停/绩效处理，
 *    由 notFailStatus / 健康信号灯驱动（红=突破）。
 *  - 先导（leading / OKR KR）＝ 战略执行的推进先导指标。只呈现"目标·实际·达成率/节奏"，
 *    属于进度信息，**不作红线告警**（不因未达成而叫停）。
 *
 * 目标基线只来自"已提交/已锁定"的快照（approved/locked），草稿不进指挥舱。
 */
import type { TrafficLight } from "@/lib/types/stratos";
import { BSC_DIM_KEYS, BSC_DIM_LABEL, type BscDimKey } from "@/lib/decode/bsc-dimensions";

export { BSC_DIM_LABEL, type BscDimKey };
export type Pace = "ahead" | "on_track" | "behind" | "unknown";

/** 先导指标（OKR KR）对比：目标来自锁定快照，实际来自 HealthSignal/FPA。 */
export interface LeadingKrComparison {
  keyResult: string;
  target: string;
  actual: string | null;
  /** 达成率 %（目标/实际均可解析为数值时），否则 null。 */
  attainmentPct: number | null;
  /** 进度节奏（中性信息，非告警）。 */
  pace: Pace;
}

/** 红线（BSC KPI 底线）对比：突破即告警。 */
export interface ThresholdComparison {
  statement: string;
  status: TrafficLight;
  breached: boolean;
}

/** 财务维度实际（来自 FPA · 预算 vs 实际，硬数据，非模糊匹配）。 */
export interface FinanceActual {
  revenueActual: number;
  revenueBudget: number;
  revenueAttainmentPct: number | null;
  profitActual: number;
  profitBudget: number;
  profitAttainmentPct: number | null;
  cashRunwayMonths: number;
}

export interface BscDimComparison {
  key: BscDimKey;
  dim: string;
  thresholds: ThresholdComparison[];
  leading: LeadingKrComparison[];
  finance?: FinanceActual;
}

export interface BscComparison {
  dims: BscDimComparison[];
  hasBaseline: boolean;
  baselineVersion: number | null;
  baselineStatus: string | null;
  baselineLabel: string | null;
  /** 任一红线突破 → 指挥舱应显著预警。 */
  anyBreached: boolean;
  /** 实际值来源：database=真实库数据；demo=演示/种子数据。由数据装配层设置。 */
  dataSource?: "database" | "demo";
}

// ── 输入形状 ──────────────────────────────────────────────────────────────
export interface BaselineDim {
  key: BscDimKey;
  krs: Array<{ keyResult: string; target: string; code?: string | null }>;
}
export interface ActualKpi {
  name: string;
  value: string | null;
  target: string | null;
  code?: string | null;
}
export interface ActualDim {
  key: BscDimKey;
  light: TrafficLight;
  kpis: ActualKpi[];
  /** 仅财务维度：FPA 预算/实际硬数据。 */
  finance?: {
    revenueActual: number;
    revenueBudget: number;
    profitActual: number;
    profitBudget: number;
    cashRunwayMonths: number;
  };
}
export interface ThresholdDim {
  key: BscDimKey;
  statements: Array<{ statement: string; status: TrafficLight }>;
}

export interface BaselineMeta {
  version: number | null;
  status: string | null;
  label: string | null;
}

// ── 纯计算 ────────────────────────────────────────────────────────────────

/** 抽取字符串中的首个数值（支持 %/万/千分位/比值取第一个数）。 */
export function parseNumeric(raw: string | null | undefined): number | null {
  if (raw == null) return null;
  const m = String(raw).replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  if (!m) return null;
  const n = Number(m[0]);
  return Number.isFinite(n) ? n : null;
}

/** 达成率与节奏。方向未知时保守：仅按 实际/目标 比例给中性节奏，不做告警。 */
export function computeAttainment(target: string, actual: string | null): { attainmentPct: number | null; pace: Pace } {
  const t = parseNumeric(target);
  const a = parseNumeric(actual);
  if (t == null || a == null || t === 0) return { attainmentPct: null, pace: "unknown" };
  const pct = Math.round((a / t) * 100);
  const pace: Pace = pct >= 100 ? "ahead" : pct >= 80 ? "on_track" : "behind";
  return { attainmentPct: pct, pace };
}

function tokens(s: string): string[] {
  return s.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, " ").split(" ").filter((t) => t.length >= 2);
}

function normName(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, "");
}

/**
 * KR ↔ 实际 KPI 匹配（收紧，避免误配 A5）：
 *  0) 稳定 code 完全相等（最强，跨维度/命名健壮 —— P1-1）。
 *  1) 规范化名称完全相等。
 *  2) 名称互相包含，且较短一方长度 ≥ 4（防止 "营收" 之类短词误命中 "营收CAGR%"）。
 *  3) 共享 ≥ 2 个有效 token（最后兜底，单 token 相同不足以判定同一指标）。
 * 命不中则返回 null（宁缺毋滥，实际显示 "—"）。
 */
function matchActual(kr: { keyResult: string; code?: string | null }, kpis: ActualKpi[]): ActualKpi | null {
  const code = kr.code?.trim();
  if (code) {
    const byCode = kpis.find((k) => k.code?.trim() && k.code.trim() === code);
    if (byCode) return byCode;
  }

  const krN = normName(kr.keyResult);
  if (!krN) return null;

  const exact = kpis.find((k) => k.name && normName(k.name) === krN);
  if (exact) return exact;

  const contained = kpis.find((k) => {
    const n = normName(k.name);
    if (n.length < 4 || krN.length < 4) return false;
    return krN.includes(n) || n.includes(krN);
  });
  if (contained) return contained;

  const krTokens = new Set(tokens(kr.keyResult));
  const byTokens = kpis.find((k) => tokens(k.name).filter((t) => krTokens.has(t)).length >= 2);
  return byTokens ?? null;
}

/**
 * 组装四维对比。红线与先导严格分离：
 *  - thresholds 来自 BSC 管理层（mustNotFail + notFailStatus）。
 *  - leading 来自锁定快照 KR，实际取自 actuals，仅算达成率/节奏。
 */
export function buildBscComparison(
  baseline: BaselineDim[],
  actuals: ActualDim[],
  thresholds: ThresholdDim[],
  meta: BaselineMeta,
): BscComparison {
  const baseByKey = new Map(baseline.map((b) => [b.key, b]));
  const actByKey = new Map(actuals.map((a) => [a.key, a]));
  const thrByKey = new Map(thresholds.map((t) => [t.key, t]));

  const dims: BscDimComparison[] = BSC_DIM_KEYS.map((key) => {
    const act = actByKey.get(key);
    const kpis = act?.kpis ?? [];
    const leading: LeadingKrComparison[] = (baseByKey.get(key)?.krs ?? [])
      .filter((kr) => kr.keyResult.trim())
      .map((kr) => {
        const matched = matchActual(kr, kpis);
        const actual = matched?.value ?? null;
        const { attainmentPct, pace } = computeAttainment(kr.target, actual);
        return { keyResult: kr.keyResult, target: kr.target, actual, attainmentPct, pace };
      });

    const thresholds2: ThresholdComparison[] = (thrByKey.get(key)?.statements ?? [])
      .filter((s) => s.statement.trim())
      .map((s) => ({ statement: s.statement, status: s.status, breached: s.status === "red" }));

    let finance: BscDimComparison["finance"];
    const fin = act?.finance;
    if (fin) {
      finance = {
        revenueActual: fin.revenueActual,
        revenueBudget: fin.revenueBudget,
        revenueAttainmentPct: fin.revenueBudget !== 0 ? Math.round((fin.revenueActual / fin.revenueBudget) * 100) : null,
        profitActual: fin.profitActual,
        profitBudget: fin.profitBudget,
        profitAttainmentPct: fin.profitBudget !== 0 ? Math.round((fin.profitActual / fin.profitBudget) * 100) : null,
        cashRunwayMonths: fin.cashRunwayMonths,
      };
    }

    return { key, dim: BSC_DIM_LABEL[key], thresholds: thresholds2, leading, finance };
  });

  const hasBaseline = baseline.some((b) => b.krs.length > 0);
  const anyBreached = dims.some((d) => d.thresholds.some((t) => t.breached));

  return {
    dims,
    hasBaseline,
    baselineVersion: meta.version,
    baselineStatus: meta.status,
    baselineLabel: meta.label,
    anyBreached,
  };
}
