/**
 * Paloma / China Strategy PPT icon palette — single source for SVG fills.
 * Semantic stack colors align with StratOS tokens; grays are PPT-faithful neutrals.
 * @see components/strategy/china-strategy-icons.tsx · docs/UI_VI_EVOLUTION.md §4.1
 */
import { colors } from "@/lib/brand/tokens";

export const pptPalette = {
  /* ── Neutrals (PPT export fidelity) ── */
  border: "#808080",
  borderLight: "#9e9e9e",
  arrow: "#a6a6a6",
  text: colors.textPrimary,
  textBody: colors.textSecondary,
  textMuted: "#666666",
  footerTag: "#808080",
  ringGray: "#d0d0d0",
  white: "#ffffff",
  iconStroke: "#666666",
  iconFillMuted: "#888888",
  iconFillDark: "#404040",
  iconFillMid: "#595959",
  iconBadgeBg: "#d9d9d9",
  iconBadgeStroke: "#aaaaaa",
  coinHighlight: "#ffd966",
  coinStroke: "#996515",
  starGold: "#ffc000",
  financeBg: "#f3f4f6",
  financeStroke: "#9ca3af",
  financeText: "#374151",
  ringLabelInactive: "#777777",
  axisLine: "#999999",

  /* ── Doctrine / three-stack (aligned with StratOS) ── */
  invest: colors.stackProd,
  innovate: colors.bscCustomer,
  deliver: "#ed7d31",
  leaf: colors.stackProd,
  globe: colors.bscCustomer,
  channels: "#f4b183",
  talent: colors.bscCustomer,
  coin: "#bf8f00",
  footerRed: colors.signalRed,
  channelsStroke: "#d9966c",
  talentStroke: "#4a86c7",
} as const;

export type PptPaletteKey = keyof typeof pptPalette;

/** @deprecated use pptPalette — kept for china-strategy-icons import ergonomics */
export const PPT = pptPalette;
