/**
 * StratOS design tokens — mirror of `app/globals.css` (Brand Tokens v2.0).
 * Source of truth for runtime styling is CSS variables; keep this file in sync for TS consumers.
 *
 * Theme: Ruud/Rheem light shell — white cards on #f5f5f5 canvas, teal interactive, red brand/risk.
 * @see docs/BRAND_VI.md · docs/UI_VI.md · docs/UI_VI_EVOLUTION.md
 */
export const brand = {
  name: "StratOS",
  /** Sidebar logo / wordmark hover label */
  markName: "Rhautt",
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
