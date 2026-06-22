/**
 * StratOS design tokens — mirror of `app/globals.css` (Brand Tokens v2.0).
 * Source of truth for runtime styling is CSS variables; keep this file in sync for TS consumers.
 *
 * Theme: Ruud/Rheem light shell — white cards on #f5f5f5 canvas, teal interactive, red brand/risk.
 * @see docs/BRAND_VI.md · docs/UI_VI.md · docs/UI_VI_EVOLUTION.md
 */
/** Rhautt group identity — from brand logo PDF (RGB 194·44·18) */
export const rhauttBrand = {
  wordmark: "Rhautt.",
  taglineEn: "THE NEW DEGREE OF COMFORT.",
  red: "#c22c12",
  black: "#000000",
  grey: "#efefef",
} as const;

export const brand = {
  name: "StratOS",
  /** Group wordmark (capital R + period) */
  markName: rhauttBrand.wordmark,
  /** Sidebar logo label under the mark */
  sidebarLabelZh: "瑞合瑞德",
  rhautt: rhauttBrand,
  fullName: "Strategic Operating System",
  taglineZh: "战略是抉择",
  taglineEn: "Decide with clarity.",
  /** Short positioning line for heroes and login */
  positioningZh: "核心层战略沙盘 · 定焦点 · 定配置 · 留历史",
} as const;

/** Ruud Toolkit R3b palette — sync with :root in globals.css */
export const ruud = {
  redPrimary: "#e4002b",
  teal: "#007681",
  cyan: "#00aeef",
  steel: "#3f585a",
  darkRed: "#76232f",
} as const;

export const colors = {
  bgDeep: "#f5f5f5",
  bgSurface: "#ffffff",
  surfaceBorder: "#e3e5e6",
  /** Interactive / strategic emphasis (Ruud teal) */
  accentStrategic: ruud.teal,
  /** Brand mark, nav active, urgent brand moments (Rheem red) */
  accentBrand: ruud.redPrimary,
  /** @deprecated Use accentStrategic — legacy alias kept for existing components */
  accentGold: ruud.teal,
  textPrimary: "#2c3133",
  textSecondary: "#4e5758",
  textMuted: "#828c8d",
  signalGreen: "#1f8a45",
  signalYellow: "#b45309",
  signalRed: "#8b0e04",
  bscCustomer: "#0c8bab",
  bscProcess: "#6344b8",
  bscLearning: "#1f8a45",
  bscFinancial: "#8b0e04",
  stackCap: "#8b0e04",
  stackProd: "#1f8a45",
  stackGtm: "#0c8bab",
  printIvory: "#faf8f5",
  printNavy: "#0a1220",
  sidebarRailBg: "#1c1f24",
} as const;

/** Typography scale — mirrors `--type-*` / `--text-*` in globals.css (UI_VI §4.2) */
export const typeScale = {
  h1: "var(--text-h1)",
  h2: "var(--text-h2)",
  body: "var(--text-body)",
  data: "var(--text-data)",
  caption: "var(--text-caption)",
  page: "var(--type-page)",
  section: "var(--type-section)",
  kpi: "var(--type-kpi)",
  kpiHero: "var(--type-kpi-hero)",
} as const;

/** Layout spacing — UI_VI §4.3 */
export const spacing = {
  pageGutter: "var(--page-gutter)",
  section: "var(--space-section)",
  card: "var(--space-card)",
} as const;

/** FP&A KPI direction colors */
export const fpaSemantic = {
  positive: "var(--fpa-kpi-positive)",
  negative: "var(--fpa-kpi-negative)",
} as const;

export const stacks = {
  cap: { label: "CapStack", color: colors.stackCap, doctrine: "Invest to Growth" },
  prod: { label: "ProdStack", color: colors.stackProd, doctrine: "Innovate to Lead" },
  gtm: { label: "GtmStack", color: colors.stackGtm, doctrine: "Deliver on Commitment" },
} as const;

/** Apple-inspired surface layers — sync with app/globals.css */
export const surfaces = {
  elevated: "var(--surface-elevated)",
  overlay: "var(--surface-overlay)",
  glassBlur: "var(--blur-glass)",
  sectionGap: "var(--space-section)",
  cardPadding: "var(--space-card)",
} as const;

export { mckinseyCadence, mckinseySections } from "./apple-mckinsey";
