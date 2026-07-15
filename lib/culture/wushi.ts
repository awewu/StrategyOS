/**
 * 五事七计 · 组织战略就绪度评估（纯函数 · 可单测 · 无 UI）
 *
 * 出处：《孙子兵法 · 始计篇》。在 StratOS 中重定位为 **Normative 组织与文化层**
 * （`/culture`）的周期性组织评价工具 —— 基于战略规划评估「组织是否准备好打这场仗」，
 * 而非每次决策的 Gate（决策 Gate 仍在 `/gates` 的 invest/innovate/deliver）。
 *
 * 维度归属（评审锁定）：
 *  - 道 / 将 / 法 = 组织维度，原生于文化层，内部评估。
 *  - 天 / 地     = 外部环境，跨链引用 `/market`(时机) 与 `/compass`(市场根基)，只读。
 *  - 七计        = 敌我对比，跨链引用 `/market` 的五力 / Hermes 信号。
 *
 * 输出：组织战略适配「风险清单」+ 就绪度计数（非打分，遵循 Blueprint「清单>假分数」）。
 */

import { dimensionStrength } from "@/lib/market-intel/swot";
import { DIMENSION_LABEL } from "@/lib/market-intel/types";
import type { CompetitorTrack, IntelDimension, IntelSignal } from "@/lib/market-intel/types";

// ───────────────────────────── 五事 ─────────────────────────────

export type WushiKey = "dao" | "tian" | "di" | "jiang" | "fa";

/** internal = 组织原生（道/将/法）；external = 跨链引用外部模块（天/地） */
export type WushiOrigin = "internal" | "external";

export type ReadinessStatus = "ready" | "partial" | "gap";

export const READINESS_LABEL: Record<ReadinessStatus, string> = {
  ready: "就绪",
  partial: "部分就绪",
  gap: "缺口",
};

export interface WushiFactor {
  key: WushiKey;
  /** 古文名：道/天/地/将/法 */
  label: string;
  /** 白话评估问题 */
  question: string;
  origin: WushiOrigin;
  status: ReadinessStatus;
  note?: string;
  /** external 因子的数据来源模块路由 */
  sourceModule?: string;
}

export const WUSHI_FACTORS: WushiFactor[] = [
  {
    key: "dao",
    label: "道",
    question: "上下是否同欲 —— 战略与使命愿景/四个满意一致，团队认同？",
    origin: "internal",
    status: "ready",
  },
  {
    key: "jiang",
    label: "将",
    question: "带队的人是否到位 —— 关键岗位有负责人且能力匹配？",
    origin: "internal",
    status: "partial",
    note: "V6 关键岗位未启动",
  },
  {
    key: "fa",
    label: "法",
    question: "组织与流程是否就绪 —— 制度、协同、激励机制支撑战略落地？",
    origin: "internal",
    status: "ready",
  },
  {
    key: "tian",
    label: "天",
    question: "时机与宏观窗口是否有利？（数据引用市场洞察）",
    origin: "external",
    status: "ready",
    sourceModule: "/market",
  },
  {
    key: "di",
    label: "地",
    question: "市场/区域根基是否稳固？（数据引用战略罗盘）",
    origin: "external",
    status: "ready",
    sourceModule: "/command/compass",
  },
];

// ───────────────────────────── 七计（敌我对比） ─────────────────────────────

export type QijiKey =
  | "zhu_dao"
  | "jiang_neng"
  | "tiandi_de"
  | "faling_xing"
  | "bingzhong_qiang"
  | "shizu_lian"
  | "shangfa_ming";

export type QijiVerdict = "we_lead" | "tie" | "rival_lead" | "unknown";

export const QIJI_VERDICT_LABEL: Record<QijiVerdict, string> = {
  we_lead: "我方占优",
  tie: "势均",
  rival_lead: "对手占优",
  unknown: "盲区（待评）",
};

export interface QijiComparison {
  key: QijiKey;
  /** 古文 */
  label: string;
  /** 白话：谁更强？ */
  plain: string;
  verdict: QijiVerdict;
  note?: string;
}

export const QIJI_QUESTIONS: QijiComparison[] = [
  { key: "zhu_dao", label: "主孰有道", plain: "哪方领导层更得人心", verdict: "unknown" },
  { key: "jiang_neng", label: "将孰有能", plain: "哪方团队能力更强", verdict: "unknown" },
  { key: "tiandi_de", label: "天地孰得", plain: "哪方占天时地利", verdict: "unknown" },
  { key: "faling_xing", label: "法令孰行", plain: "哪方执行纪律更好", verdict: "unknown" },
  { key: "bingzhong_qiang", label: "兵众孰强", plain: "哪方资源/规模更大", verdict: "unknown" },
  { key: "shizu_lian", label: "士卒孰练", plain: "哪方一线更熟练", verdict: "unknown" },
  { key: "shangfa_ming", label: "赏罚孰明", plain: "哪方激励机制更清晰", verdict: "unknown" },
];

export interface WushiAssessment {
  /** 对标的主要竞争对手（七计用） */
  rival?: string;
  factors: WushiFactor[];
  qiji: QijiComparison[];
}

export function defaultWushiAssessment(rival?: string): WushiAssessment {
  return {
    rival,
    factors: WUSHI_FACTORS.map((f) => ({ ...f })),
    qiji: QIJI_QUESTIONS.map((q) => ({ ...q })),
  };
}

// ───────────────────────────── 风险清单 + 就绪度 ─────────────────────────────

export type WushiRiskKind = "factor" | "qiji";

export interface WushiRisk {
  kind: WushiRiskKind;
  /** 五事/七计的来源标签，如「将」「主孰有道」 */
  source: string;
  message: string;
  severity: "high" | "medium";
}

/**
 * 生成组织战略适配风险清单（非打分）。
 *  - 五事：gap → high；partial → medium。
 *  - 七计：rival_lead → high；unknown(盲区) → medium。
 */
export function buildWushiRiskList(a: WushiAssessment): WushiRisk[] {
  const risks: WushiRisk[] = [];

  for (const f of a.factors) {
    if (f.status === "gap") {
      risks.push({
        kind: "factor",
        source: f.label,
        message: `${f.label} 缺口：${f.note ?? f.question}`,
        severity: "high",
      });
    } else if (f.status === "partial") {
      risks.push({
        kind: "factor",
        source: f.label,
        message: `${f.label} 部分就绪：${f.note ?? f.question}`,
        severity: "medium",
      });
    }
  }

  for (const q of a.qiji) {
    if (q.verdict === "rival_lead") {
      risks.push({
        kind: "qiji",
        source: q.label,
        message: `${q.label}（${q.plain}）：${a.rival ?? "对手"}占优${q.note ? ` · ${q.note}` : ""}`,
        severity: "high",
      });
    } else if (q.verdict === "unknown") {
      risks.push({
        kind: "qiji",
        source: q.label,
        message: `${q.label}（${q.plain}）：盲区，缺乏对标证据`,
        severity: "medium",
      });
    }
  }

  // high 在前
  return risks.sort((x, y) => (x.severity === y.severity ? 0 : x.severity === "high" ? -1 : 1));
}

export interface WushiReadiness {
  ready: number;
  partial: number;
  gap: number;
  /** 外部跨链因子（天/地）数量，提示其数据非本模块录入 */
  externalCount: number;
}

/** 五事就绪度计数（非综合分）。 */
export function wushiReadiness(factors: WushiFactor[]): WushiReadiness {
  const r: WushiReadiness = { ready: 0, partial: 0, gap: 0, externalCount: 0 };
  for (const f of factors) {
    r[f.status] += 1;
    if (f.origin === "external") r.externalCount += 1;
  }
  return r;
}

export interface QijiTally {
  weLead: number;
  tie: number;
  rivalLead: number;
  unknown: number;
}

/** 七计对比计数。 */
export function qijiTally(qiji: QijiComparison[]): QijiTally {
  const t: QijiTally = { weLead: 0, tie: 0, rivalLead: 0, unknown: 0 };
  for (const q of qiji) {
    if (q.verdict === "we_lead") t.weLead += 1;
    else if (q.verdict === "tie") t.tie += 1;
    else if (q.verdict === "rival_lead") t.rivalLead += 1;
    else t.unknown += 1;
  }
  return t;
}

/** 只取组织原生（道/将/法）因子 —— 文化层可直接编辑的部分。 */
export function internalFactors(factors: WushiFactor[]): WushiFactor[] {
  return factors.filter((f) => f.origin === "internal");
}

// ───────────────────────────── 七计自动推导（Hermes 信号） ─────────────────────────────

interface QijiDerivationInput {
  signals: IntelSignal[];
  tracks: CompetitorTrack[];
  selfScores: Partial<Record<IntelDimension, number>>;
  rival: string;
}

const QIJI_DIMENSION_MAP: Record<QijiKey, IntelDimension[]> = {
  zhu_dao: ["strategy", "brand"],
  jiang_neng: ["product", "strategy"],
  tiandi_de: ["gtm", "brand"],
  faling_xing: ["strategy", "gtm"],
  bingzhong_qiang: ["product", "gtm", "brand", "strategy"],
  shizu_lian: ["gtm", "product"],
  shangfa_ming: ["strategy", "brand"],
};

const MOMENTUM_DELTA = { up: 8, down: -8, flat: 0 };

function clamp01to100(n: number): number {
  return Math.max(0, Math.min(100, n));
}

/**
 * 从 Hermes 信号自动推导七计 verdict。
 * 每个七计项映射到 1–2 个情报维度；用「我方自评分」与「对手该维度信号强度」比较，
 * 并用 CompetitorTrack 动量做 ±8 调整，最后给出 we_lead / tie / rival_lead / unknown。
 */
export function deriveQijiVerdicts(input: QijiDerivationInput): QijiComparison[] {
  const { signals, tracks, selfScores, rival } = input;
  const base = QIJI_QUESTIONS.map((q) => ({ ...q }));

  const rivalSignals = signals.filter((s) => s.competitor === rival);
  const rivalDim = (dim: IntelDimension): number | null => dimensionStrength(rivalSignals, dim);

  const selfDim = (dim: IntelDimension): number => selfScores[dim] ?? 50;

  const avg = (dims: IntelDimension[]): number =>
    dims.reduce((acc, d) => acc + selfDim(d), 0) / dims.length;

  const rivalAvg = (dims: IntelDimension[]): number | null => {
    const vals = dims.map(rivalDim).filter((v): v is number => v !== null);
    if (vals.length === 0) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  };

  const momentum = tracks.find((t) => t.competitor === rival)?.momentum ?? "flat";
  const delta = MOMENTUM_DELTA[momentum];

  for (const q of base) {
    const dims = QIJI_DIMENSION_MAP[q.key];
    const our = avg(dims);
    const their = rivalAvg(dims);
    if (their == null) {
      q.verdict = "unknown";
      q.note = "缺乏该维度 Hermes 信号";
      continue;
    }
    const theirAdj = clamp01to100(their + delta);
    if (our > theirAdj + 5) q.verdict = "we_lead";
    else if (theirAdj > our + 5) q.verdict = "rival_lead";
    else q.verdict = "tie";
    q.note = `基于 ${dims.map((d) => DIMENSION_LABEL[d]).join("、")} 维度信号`;
  }

  return base;
}
