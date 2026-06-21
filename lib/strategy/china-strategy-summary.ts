/**
 * China Strategy Summary — one-pager schema + empty framework template.
 * Three columns × three sub-modules; bilingual titles; free-form content.
 */

export type StrategyIconKey =
  | "none"
  | "cart"
  | "premium"
  | "leaf"
  | "expertise"
  | "globe"
  | "product"
  | "channels"
  | "talent"
  | "chart"
  | "finance"
  | "target"
  | "invest"
  | "innovate"
  | "deliver";

export interface StrategySubmodule {
  id: string;
  title: string;
  titleZh: string;
  content: string;
  hint?: string;
  titleUnderline?: boolean;
  /** @deprecated Use placedIcons on slide instead */
  icon?: StrategyIconKey | null;
}

/** Free-floating icon on the slide canvas (percent position + pixel size). */
export interface PlacedStrategyIcon {
  id: string;
  icon: StrategyIconKey;
  xPct: number;
  yPct: number;
  sizePx: number;
}

/** Column width ratios (left, middle, right) — sum = 100 */
export type ColumnWidths = [number, number, number];

export const DEFAULT_COLUMN_WIDTHS: ColumnWidths = [29, 38, 29];

export interface ChinaStrategySummaryData {
  title: string;
  titleZh: string;
  leftColumnTitle: string;
  leftColumnTitleZh: string;
  middleColumnTitle: string;
  middleColumnTitleZh: string;
  rightColumnTitle: string;
  rightColumnTitleZh: string;
  periodLabel: string;
  columnWidths: ColumnWidths;
  leftModules: StrategySubmodule[];
  middleModules: StrategySubmodule[];
  rightModules: StrategySubmodule[];
  placedIcons: PlacedStrategyIcon[];
  footerBrand: string;
  footerTag: string;
  pageNumber: number;
}

/** @deprecated Legacy shape — normalized on load. */
export interface LegacyChinaStrategySummaryData {
  marketDrivers?: { label: string }[];
  coreStrengths?: { id: string; label: string }[];
  strengthsToDevelop?: { label: string }[];
  strategicPriorities?: { id: string; label: string; items: string[] }[];
  outcomes?: { label: string; value: string; sublines: string[] }[];
}

function mod(
  id: string,
  title: string,
  titleZh: string,
  hint: string,
  titleUnderline?: boolean
): StrategySubmodule {
  return { id, title, titleZh, content: "", hint, titleUnderline };
}

/** Default one-pager: bilingual framework; content blank for editors. */
export const CHINA_STRATEGY_FRAMEWORK: ChinaStrategySummaryData = {
  title: "",
  titleZh: "战略汇总",
  leftColumnTitle: "Where we are",
  leftColumnTitleZh: "我们在哪里",
  middleColumnTitle: "Strategic Priorities",
  middleColumnTitleZh: "战略优先级",
  rightColumnTitle: "What's the Measurement",
  rightColumnTitleZh: "衡量什么",
  periodLabel: "2020-2025",
  columnWidths: [...DEFAULT_COLUMN_WIDTHS],
  leftModules: [
    mod("left-1", "Market Drivers", "市场驱动力", "市场趋势、政策与客户变化 — 建议 3–5 条要点"),
    mod("left-2", "Core Strengths", "核心优势", "我们已具备、可依赖的能力 — 建议 2–4 条"),
    mod("left-3", "Strengths to be developed", "待提升能力", "未来 3 年必须补齐的能力差距", true),
  ],
  middleModules: [
    mod("mid-1", "Invest to Grow", "投资增长", "资源投向与增长杠杆 — 动词开头，3–5 条"),
    mod("mid-2", "Innovate to Lead", "创新领先", "产品、技术、模式创新重点"),
    mod("mid-3", "Deliver on Commitments", "兑现承诺", "产能、交付、组织与执行保障"),
  ],
  rightModules: [
    mod("right-1", "BSC", "平衡计分卡", "财务 / 客户 / 流程 / 学习各 1–2 个关键指标"),
    mod("right-2", "Finance outcome", "财务成果", "收入、利润、现金流等量化目标"),
    mod("right-3", "Product/Market Share", "产品/市场份额", "份额、品类、区域或产品线目标"),
  ],
  footerBrand: "Rhautt",
  footerTag: "5 Year Strategy | Confidential",
  pageNumber: 2,
  placedIcons: [],
};

const MIN_ICON_PCT = 0;
const MAX_ICON_PCT = 98;
const MIN_ICON_SIZE = 14;
const MAX_ICON_SIZE = 72;

export function normalizePlacedIcons(raw?: PlacedStrategyIcon[]): PlacedStrategyIcon[] {
  if (!raw?.length) return [];
  return raw
    .filter((p) => p.icon && p.icon !== "none")
    .map((p) => ({
      id: p.id || `pi-${Math.random().toString(36).slice(2, 9)}`,
      icon: p.icon,
      xPct: Math.min(MAX_ICON_PCT, Math.max(MIN_ICON_PCT, Number(p.xPct) || 0)),
      yPct: Math.min(MAX_ICON_PCT, Math.max(MIN_ICON_PCT, Number(p.yPct) || 0)),
      sizePx: Math.min(MAX_ICON_SIZE, Math.max(MIN_ICON_SIZE, Math.round(Number(p.sizePx) || 28))),
    }));
}

function mergeSubmodule(base: StrategySubmodule, raw?: Partial<StrategySubmodule>): StrategySubmodule {
  return {
    ...base,
    ...raw,
    title: raw?.title?.trim() ? raw.title : base.title,
    titleZh: raw?.titleZh?.trim() ? raw.titleZh : base.titleZh,
    hint: raw?.hint ?? base.hint,
    content: raw?.content ?? "",
  };
}

const MIN_COL_PCT = 15;

export function normalizeColumnWidths(raw?: number[] | ColumnWidths): ColumnWidths {
  if (!raw || raw.length !== 3) return [...DEFAULT_COLUMN_WIDTHS];
  let [l, m, r] = raw.map((n) => Math.round(Number(n) || 0)) as ColumnWidths;
  const sum = l + m + r;
  if (sum <= 0) return [...DEFAULT_COLUMN_WIDTHS];
  l = (l / sum) * 100;
  m = (m / sum) * 100;
  r = 100 - l - m;
  l = Math.max(MIN_COL_PCT, Math.min(l, 100 - 2 * MIN_COL_PCT));
  r = Math.max(MIN_COL_PCT, Math.min(r, 100 - l - MIN_COL_PCT));
  m = 100 - l - r;
  m = Math.max(MIN_COL_PCT, m);
  r = 100 - l - m;
  return [Math.round(l * 10) / 10, Math.round(m * 10) / 10, Math.round(r * 10) / 10];
}

export function columnGridTemplate(widths: ColumnWidths, withResizers: boolean): string {
  const [a, b, c] = widths;
  if (withResizers) return `${a}fr 8px 28px ${b}fr 8px 28px ${c}fr`;
  return `${a}fr 28px ${b}fr 28px ${c}fr`;
}

function mergeColumnPair(en: string | undefined, zh: string | undefined, baseEn: string, baseZh: string) {
  return {
    en: en?.trim() ? en : baseEn,
    zh: zh?.trim() ? zh : baseZh,
  };
}

/** Merge saved JSON (incl. legacy) into current schema. */
export function normalizeChinaStrategyContent(
  raw: Partial<ChinaStrategySummaryData> & LegacyChinaStrategySummaryData
): ChinaStrategySummaryData {
  const base = CHINA_STRATEGY_FRAMEWORK;

  if (raw.leftModules?.length === 3 && raw.middleModules?.length === 3 && raw.rightModules?.length === 3) {
    const titles = mergeColumnPair(raw.title, raw.titleZh, base.title, base.titleZh);
    const leftCol = mergeColumnPair(raw.leftColumnTitle, raw.leftColumnTitleZh, base.leftColumnTitle, base.leftColumnTitleZh);
    const midCol = mergeColumnPair(raw.middleColumnTitle, raw.middleColumnTitleZh, base.middleColumnTitle, base.middleColumnTitleZh);
    const rightCol = mergeColumnPair(raw.rightColumnTitle, raw.rightColumnTitleZh, base.rightColumnTitle, base.rightColumnTitleZh);

    return {
      ...base,
      ...raw,
      title: titles.en,
      titleZh: titles.zh,
      leftColumnTitle: leftCol.en,
      leftColumnTitleZh: leftCol.zh,
      middleColumnTitle: midCol.en,
      middleColumnTitleZh: midCol.zh,
      rightColumnTitle: rightCol.en,
      rightColumnTitleZh: rightCol.zh,
      periodLabel: raw.periodLabel?.trim() ? raw.periodLabel : base.periodLabel,
      columnWidths: normalizeColumnWidths(raw.columnWidths),
      leftModules: raw.leftModules.map((m, i) => mergeSubmodule(base.leftModules[i], m)),
      middleModules: raw.middleModules.map((m, i) => mergeSubmodule(base.middleModules[i], m)),
      rightModules: raw.rightModules.map((m, i) => mergeSubmodule(base.rightModules[i], m)),
      placedIcons: normalizePlacedIcons(raw.placedIcons),
    };
  }

  const leftContent = [
    raw.marketDrivers?.map((d) => d.label).filter(Boolean).join("\n"),
    raw.coreStrengths?.map((s) => s.label).filter(Boolean).join("\n"),
    raw.strengthsToDevelop?.map((s) => s.label).filter(Boolean).join("\n"),
  ];

  const middleContent =
    raw.strategicPriorities?.map((t) => t.items.filter(Boolean).join("\n")) ?? [];

  const rightContent =
    raw.outcomes?.map((k) =>
      [k.label, k.value, ...(k.sublines ?? [])].filter(Boolean).join("\n")
    ) ?? [];

  return {
    ...base,
    title: raw.title ?? "",
    titleZh: raw.titleZh?.trim() ? raw.titleZh : base.titleZh,
    leftColumnTitle: raw.leftColumnTitle ?? base.leftColumnTitle,
    leftColumnTitleZh: raw.leftColumnTitleZh ?? base.leftColumnTitleZh,
    middleColumnTitle: raw.middleColumnTitle ?? base.middleColumnTitle,
    middleColumnTitleZh: raw.middleColumnTitleZh ?? base.middleColumnTitleZh,
    rightColumnTitle: raw.rightColumnTitle ?? base.rightColumnTitle,
    rightColumnTitleZh: raw.rightColumnTitleZh ?? base.rightColumnTitleZh,
    periodLabel: raw.periodLabel?.trim() ? raw.periodLabel : base.periodLabel,
    columnWidths: normalizeColumnWidths(raw.columnWidths),
    leftModules: base.leftModules.map((m, i) => ({ ...m, content: leftContent[i] ?? "" })),
    middleModules: base.middleModules.map((m, i) => ({ ...m, content: middleContent[i] ?? "" })),
    rightModules: base.rightModules.map((m, i) => ({ ...m, content: rightContent[i] ?? "" })),
    footerBrand: raw.footerBrand ?? base.footerBrand,
    footerTag: raw.footerTag ?? base.footerTag,
    pageNumber: raw.pageNumber ?? base.pageNumber,
    placedIcons: normalizePlacedIcons(raw.placedIcons),
  };
}

/** @deprecated Use CHINA_STRATEGY_FRAMEWORK — kept for imports. */
export const CHINA_STRATEGY_SUMMARY = CHINA_STRATEGY_FRAMEWORK;
