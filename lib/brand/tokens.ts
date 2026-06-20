/**
 * StratOS design tokens — sync with docs/BRAND_VI.md · docs/UI_VI_EVOLUTION.md
 *
 * Positioning: executive strategic sandbox for ~30 core mgmt (Rheem-scale).
 * Voice: 抉择 / resource allocation — NOT gambling or betting metaphors in UI copy.
 */
export const brand = {
  name: "StratOS",
  fullName: "Strategic Operating System",
  taglineZh: "战略是抉择",
  taglineEn: "Decide with clarity.",
  /** Short positioning line for heroes and login */
  positioningZh: "核心层战略沙盘 · 定焦点 · 定配置 · 留历史",
} as const;

export const colors = {
  bgDeep: "#0c0e0d",
  bgSurface: "#14171a",
  accentGold: "#8b0e04",
  textPrimary: "#f0f0f0",
  textMuted: "#8a8a8a",
  signalGreen: "#2d9e52",
  signalYellow: "#d97706",
  signalRed: "#8b0e04",
  bscCustomer: "#2b8fd0",
  bscProcess: "#7357c2",
  bscLearning: "#2d9e52",
  stackCap: "#8b0e04",
  stackProd: "#2d9e52",
  stackGtm: "#2b8fd0",
  printIvory: "#FAF8F5",
  printNavy: "#0a1220",
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
