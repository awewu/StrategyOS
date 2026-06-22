/**
 * SWOT 推演引擎（纯函数 · 可单测 · 无 UI / 无网络）
 *
 * 归属：市场洞察 `/market`（外部 O/T + AI 推演）+ 战略洞察 `/compass`（内部 S/W 数据源）。
 *
 * 三件事：
 *  1. buildSwot       —— 把 Hermes 信号(impact=机会/威胁) 归集为 O/T，并入外部传入的 S/W。
 *  2. buildPositioning —— 十字坐标轴：按打分把「我方」与各竞争对手定位到四象限。
 *  3. generateTows / buildSwotPrompt / parseSwotResponse —— TOWS(SO/WO/ST/WT) 战略建议，
 *                       规则引擎兜底 + LLM 推演（提示词与解析在此，网络调用在 market-ask-llm.ts）。
 *
 * 设计原则：与 Hermes 同源——O/T 来自已佐证信号(relevance/impact)，不编造；
 * 打分确定性，无 LLM 也可出坐标与象限。
 */
import {
  DIMENSION_LABEL,
  type IntelDimension,
  type IntelSignal,
} from "./types";

// ───────────────────────────── SWOT 四象限 ─────────────────────────────

export type SwotCategory = "strength" | "weakness" | "opportunity" | "threat";

export const SWOT_CATEGORY_LABEL: Record<SwotCategory, string> = {
  strength: "优势 (S)",
  weakness: "劣势 (W)",
  opportunity: "机会 (O)",
  threat: "威胁 (T)",
};

export interface SwotItem {
  id: string;
  category: SwotCategory;
  title: string;
  /** 重要性 1..5（越大越关键） */
  weight: number;
  /** 强度/置信 1..5 */
  intensity: number;
  /** 来源维度（外部项继承信号维度） */
  dimension?: IntelDimension;
  /** 佐证引文或内部数据出处，如 "internal:health.runway" / 信号 id */
  source?: string;
  evidence?: string;
}

export interface SwotBoard {
  strength: SwotItem[];
  weakness: SwotItem[];
  opportunity: SwotItem[];
  threat: SwotItem[];
}

/**
 * 把竞争情报信号归集为 O/T，与外部传入的内部 S/W 合并成完整 SWOT 盘面。
 *
 * - impact "opportunity" → O（对我方是机会，常意味着竞品留出的空当）
 * - impact "threat"      → T（对我方是威胁）
 * - impact "neutral"     → 跳过（仅作上下文，不进盘面）
 *
 * relevance(0..100) 映射为 weight/intensity(1..5)，越相关越靠前。
 */
export function buildSwot(
  signals: IntelSignal[],
  internal: SwotItem[] = [],
): SwotBoard {
  const board: SwotBoard = { strength: [], weakness: [], opportunity: [], threat: [] };

  for (const item of internal) {
    if (item.category === "strength") board.strength.push(item);
    else if (item.category === "weakness") board.weakness.push(item);
  }

  for (const sig of signals) {
    if (sig.impact === "neutral") continue;
    const category: SwotCategory = sig.impact === "opportunity" ? "opportunity" : "threat";
    const item: SwotItem = {
      id: `swot-${sig.id}`,
      category,
      title: `${sig.competitor} · ${sig.title}`,
      weight: relevanceToScale(sig.relevance),
      intensity: relevanceToScale(sig.relevance),
      dimension: sig.dimension,
      source: sig.id,
      evidence: sig.evidence,
    };
    board[category].push(item);
  }

  for (const key of ["strength", "weakness", "opportunity", "threat"] as const) {
    board[key].sort((a, b) => b.weight * b.intensity - a.weight * a.intensity);
  }
  return board;
}

/** relevance 0..100 → 1..5 量表 */
export function relevanceToScale(relevance: number): number {
  const r = Math.max(0, Math.min(100, relevance));
  return Math.max(1, Math.min(5, Math.round(r / 20)));
}

/** 战略前提的最小形状（来自 /compass PremiseAudit）。 */
export interface PremiseLike {
  code: string;
  premise: string;
  /** 信心 0..100 */
  confidence: number;
  /** 脆弱度 0..100 */
  fragility: number;
  failSignal?: string | null;
  category?: string;
}

/**
 * 从 /compass 战略前提审计派生内部 S/W：
 *  - 优势 S：信心高(≥65) 且 脆弱低(≤60) 且 无失效信号。
 *  - 劣势 W：有失效信号 或 信心<50 或 脆弱≥80。
 *  - 其余跳过（不确定，不进盘面）。
 * 这是「/compass 作为 S/W 数据源」的物理勾连点。
 */
export function internalSwotFromPremises(premises: PremiseLike[]): SwotItem[] {
  const items: SwotItem[] = [];
  for (const p of premises) {
    const isWeak = !!p.failSignal || p.confidence < 50 || p.fragility >= 80;
    const isStrong = !p.failSignal && p.confidence >= 65 && p.fragility <= 60;
    if (!isWeak && !isStrong) continue;
    const category: SwotCategory = isWeak ? "weakness" : "strength";
    items.push({
      id: `swot-premise-${p.code}`,
      category,
      title: isWeak && p.failSignal ? `${p.premise}（${p.failSignal}）` : p.premise,
      weight: scoreFromPct(p.fragility),
      intensity: scoreFromPct(isWeak ? 100 - p.confidence : p.confidence),
      source: `internal:compass:${p.code}`,
    });
  }
  return items.sort((a, b) => b.weight * b.intensity - a.weight * a.intensity);
}

function scoreFromPct(pct: number): number {
  return Math.max(1, Math.min(5, Math.round(Math.max(0, Math.min(100, pct)) / 20)));
}

// ─────────────────────────── 十字坐标轴 · 竞品定位 ───────────────────────────

export interface PositioningAxis {
  key: string;
  label: string;
  /** 该轴由哪些情报维度合成 */
  dims: IntelDimension[];
}

/** 默认双轴：X=产品·创新力（product+strategy）；Y=渠道·品牌力（gtm+brand） */
export const DEFAULT_AXES: { x: PositioningAxis; y: PositioningAxis } = {
  x: { key: "innovation", label: "产品 · 创新力", dims: ["product", "strategy"] },
  y: { key: "market", label: "渠道 · 品牌力", dims: ["gtm", "brand"] },
};

export type PositioningQuadrant = "leader" | "product_led" | "market_led" | "follower";

export const QUADRANT_LABEL: Record<PositioningQuadrant, string> = {
  leader: "领先者（双强）",
  product_led: "产品驱动（产品强/渠道弱）",
  market_led: "渠道驱动（渠道强/产品弱）",
  follower: "跟随者（双弱）",
};

export interface PositioningEntity {
  entity: string;
  isUs: boolean;
  /** 0..100 */
  x: number;
  /** 0..100 */
  y: number;
  quadrant: PositioningQuadrant;
  /** 数据完备度 0..1（盲区越多越低，提示判读风险） */
  confidence: number;
  signalCount: number;
}

export interface PositioningMap {
  xAxis: PositioningAxis;
  yAxis: PositioningAxis;
  /** 象限分界（默认 50/50） */
  midpoint: { x: number; y: number };
  entities: PositioningEntity[];
}

export interface PositioningOptions {
  axes?: { x: PositioningAxis; y: PositioningAxis };
  /** 我方各维度自评分 0..100（来自 /compass 内部数据或人工录入）；缺省 50 基线 */
  selfScores?: Partial<Record<IntelDimension, number>>;
  /** 我方名称 */
  selfLabel?: string;
  midpoint?: { x: number; y: number };
}

/** impact 对竞品「强度」的权重：威胁=竞品强，中性次之，机会=竞品留有空当 */
const IMPACT_STRENGTH_WEIGHT: Record<IntelSignal["impact"], number> = {
  threat: 1,
  neutral: 0.5,
  opportunity: 0.35,
};

const MOMENTUM_DELTA = { up: 8, down: -8, flat: 0 } as const;

/**
 * 单个实体在某一维度的能力分 0..100：
 *   mean(relevance × impactWeight)；无信号 → null（盲区）。
 */
export function dimensionStrength(
  signals: IntelSignal[],
  dim: IntelDimension,
): number | null {
  const inDim = signals.filter((s) => s.dimension === dim);
  if (inDim.length === 0) return null;
  const sum = inDim.reduce(
    (acc, s) => acc + clamp01to100(s.relevance) * IMPACT_STRENGTH_WEIGHT[s.impact],
    0,
  );
  return clamp01to100(sum / inDim.length);
}

/** 某条轴的得分 = 轴关联维度中「有数据」维度的均值；全盲区 → null */
export function axisScore(
  signals: IntelSignal[],
  axis: PositioningAxis,
): { score: number | null; covered: number } {
  const vals = axis.dims
    .map((d) => dimensionStrength(signals, d))
    .filter((v): v is number => v !== null);
  if (vals.length === 0) return { score: null, covered: 0 };
  const score = vals.reduce((a, b) => a + b, 0) / vals.length;
  return { score, covered: vals.length / axis.dims.length };
}

function classifyQuadrant(
  x: number,
  y: number,
  mid: { x: number; y: number },
): PositioningQuadrant {
  if (x >= mid.x && y >= mid.y) return "leader";
  if (x >= mid.x && y < mid.y) return "product_led";
  if (x < mid.x && y >= mid.y) return "market_led";
  return "follower";
}

/**
 * 构建十字坐标定位图：把「我方」与每个竞争对手打分落到四象限。
 * 竞品分来自 Hermes 信号；我方分来自 selfScores（缺省 50）。
 */
export function buildPositioning(
  signals: IntelSignal[],
  momentumByEntity: Record<string, "up" | "down" | "flat"> = {},
  opts: PositioningOptions = {},
): PositioningMap {
  const axes = opts.axes ?? DEFAULT_AXES;
  const midpoint = opts.midpoint ?? { x: 50, y: 50 };
  const selfLabel = opts.selfLabel ?? "我方";

  const competitors = [...new Set(signals.map((s) => s.competitor))];
  const entities: PositioningEntity[] = [];

  // 竞争对手
  for (const name of competitors) {
    const own = signals.filter((s) => s.competitor === name);
    const xa = axisScore(own, axes.x);
    const ya = axisScore(own, axes.y);
    const delta = MOMENTUM_DELTA[momentumByEntity[name] ?? "flat"];
    const x = clamp01to100((xa.score ?? 30) + delta);
    const y = clamp01to100((ya.score ?? 30) + delta);
    entities.push({
      entity: name,
      isUs: false,
      x,
      y,
      quadrant: classifyQuadrant(x, y, midpoint),
      confidence: (xa.covered + ya.covered) / 2,
      signalCount: own.length,
    });
  }

  // 我方
  const self = opts.selfScores ?? {};
  const selfAxis = (axis: PositioningAxis): number => {
    const vals = axis.dims.map((d) => self[d]).filter((v): v is number => typeof v === "number");
    if (vals.length === 0) return 50;
    return clamp01to100(vals.reduce((a, b) => a + b, 0) / vals.length);
  };
  const sx = selfAxis(axes.x);
  const sy = selfAxis(axes.y);
  const selfDims = (Object.keys(self) as IntelDimension[]).length;
  entities.push({
    entity: selfLabel,
    isUs: true,
    x: sx,
    y: sy,
    quadrant: classifyQuadrant(sx, sy, midpoint),
    confidence: selfDims > 0 ? Math.min(1, selfDims / 4) : 0,
    signalCount: 0,
  });

  return { xAxis: axes.x, yAxis: axes.y, midpoint, entities };
}

// ─────────────────────────── TOWS 战略建议 ───────────────────────────

export type TowsType = "SO" | "WO" | "ST" | "WT";

export const TOWS_LABEL: Record<TowsType, string> = {
  SO: "SO · 增长（用优势抓机会）",
  WO: "WO · 扭转（补劣势抓机会）",
  ST: "ST · 防御（用优势御威胁）",
  WT: "WT · 规避（防劣势避威胁）",
};

export interface TowsRecommendation {
  type: TowsType;
  title: string;
  rationale: string;
  /** 建议链到的模块路由，如 "/decode" "/gates" "/compass" */
  links: string[];
}

export type TowsSet = Record<TowsType, TowsRecommendation[]>;

/**
 * 规则引擎兜底：按 weight×intensity 取 top 项配对，生成 4 类 TOWS 建议雏形。
 * （LLM 可用时用 buildSwotPrompt → parseSwotResponse 覆盖。）
 */
export function generateTows(board: SwotBoard, perType = 1): TowsSet {
  const topS = board.strength.slice(0, perType);
  const topW = board.weakness.slice(0, perType);
  const topO = board.opportunity.slice(0, perType);
  const topT = board.threat.slice(0, perType);

  const pair = (
    type: TowsType,
    a: SwotItem[],
    b: SwotItem[],
    verb: string,
    links: string[],
  ): TowsRecommendation[] => {
    const out: TowsRecommendation[] = [];
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      out.push({
        type,
        title: `${verb}：${short(a[i].title)} × ${short(b[i].title)}`,
        rationale: `${SWOT_CATEGORY_LABEL[a[i].category]}「${short(a[i].title)}」对接${SWOT_CATEGORY_LABEL[b[i].category]}「${short(b[i].title)}」。`,
        links,
      });
    }
    return out;
  };

  return {
    SO: pair("SO", topS, topO, "乘势进攻", ["/decode", "/compass"]),
    WO: pair("WO", topW, topO, "补短抓机", ["/decode", "/outlook"]),
    ST: pair("ST", topS, topT, "以长御险", ["/gates", "/execution"]),
    WT: pair("WT", topW, topT, "收缩规避", ["/gates", "/health"]),
  };
}

// ─────────────────────────── LLM 推演（提示词/解析） ───────────────────────────

/** 构建 SWOT→TOWS 的 LLM 提示词（网络调用在 market-ask-llm.ts 的 askSwotAi 内）。 */
export function buildSwotPrompt(board: SwotBoard): { system: string; user: string } {
  const system = [
    "你是 StratOS 战略推演助手，服务 Rheem/Ruud 中国战略团队。",
    "基于给定的 SWOT 盘面做 TOWS 交叉推演，输出 SO/WO/ST/WT 四类可执行战略建议。",
    '返回 JSON：{ "SO": [{"title":"...","rationale":"...","links":["/decode"]}], "WO": [...], "ST": [...], "WT": [...] }',
    "中文，每类 1–3 条，建议具体可落地；links 从 /decode /gates /compass /outlook /execution /health 中选。",
    "严禁编造盘面中没有的事实。",
  ].join("\n");
  const user = ["SWOT 盘面：", JSON.stringify(serializeBoard(board), null, 2)].join("\n");
  return { system, user };
}

/** 解析 LLM 返回的 TOWS JSON；非法时返回 null 由调用方回退规则引擎。 */
export function parseSwotResponse(raw: string): TowsSet | null {
  try {
    const obj = JSON.parse(raw) as Record<string, unknown>;
    const out: TowsSet = { SO: [], WO: [], ST: [], WT: [] };
    for (const type of ["SO", "WO", "ST", "WT"] as TowsType[]) {
      const arr = obj[type];
      if (!Array.isArray(arr)) continue;
      out[type] = arr
        .filter((r): r is Record<string, unknown> => !!r && typeof r === "object")
        .map((r) => ({
          type,
          title: String(r.title ?? ""),
          rationale: String(r.rationale ?? ""),
          links: Array.isArray(r.links) ? r.links.map(String) : [],
        }))
        .filter((r) => r.title.length > 0);
    }
    const total = (["SO", "WO", "ST", "WT"] as TowsType[]).reduce((n, t) => n + out[t].length, 0);
    return total > 0 ? out : null;
  } catch {
    return null;
  }
}

// ───────────────────────────── helpers ─────────────────────────────

function clamp01to100(n: number): number {
  return Math.max(0, Math.min(100, n));
}

function short(s: string, n = 28): string {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

function serializeBoard(board: SwotBoard) {
  const fmt = (items: SwotItem[]) =>
    items.slice(0, 6).map((i) => ({
      title: i.title,
      weight: i.weight,
      intensity: i.intensity,
      dim: i.dimension ? DIMENSION_LABEL[i.dimension] : undefined,
    }));
  return {
    strength: fmt(board.strength),
    weakness: fmt(board.weakness),
    opportunity: fmt(board.opportunity),
    threat: fmt(board.threat),
  };
}
