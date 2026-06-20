/** StratOS typography scale — UI_VI §32:20:12 · Apple × McKinsey rhythm */
export const typography = {
  h1:     "text-[1.875rem] font-semibold leading-[1.1] tracking-[-0.025em]",
  h2:     "text-[1.0625rem] font-semibold leading-snug tracking-[-0.01em]",
  h3:     "text-[0.6875rem] font-medium uppercase tracking-[0.1em] text-[var(--color-text-muted)]",
  body:   "text-[0.9375rem] leading-[1.6]",
  caption:"text-[0.75rem] leading-relaxed text-[var(--color-text-muted)]",
  data:   "font-data text-[1.125rem] tabular-nums tracking-tight",
  /** Primary KPI — 44px, Bloomberg-style */
  dataXl: "font-data text-[2.75rem] tabular-nums tracking-[-0.03em] leading-none",
  /** Section KPI — 32px */
  dataLg: "font-data text-[2rem] tabular-nums tracking-[-0.02em] leading-none",
  /** Inline metric — 20px */
  dataMd: "font-data text-[1.25rem] tabular-nums tracking-tight leading-none",
} as const;
