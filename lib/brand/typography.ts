/** StratOS typography — sync with --type-* tokens in app/globals.css */
export const typography = {
  h1:     "text-headline text-[var(--color-text-primary)]",
  h2:     "text-title text-[var(--color-text-primary)]",
  h3:     "text-subsection text-[var(--color-text-primary)]",
  /** Page section eyebrow — CJK-safe, no uppercase */
  eyebrow:"text-label text-[var(--color-text-muted)]",
  body:   "text-callout text-[var(--color-text-secondary)]",
  caption:"text-caption",
  data:   "font-data text-[1.125rem] tabular-nums tracking-tight",
  /** Primary KPI — hero slot */
  dataXl: "font-data text-[var(--type-kpi-hero)] tabular-nums tracking-[-0.03em] leading-none",
  /** Section KPI — tile slot */
  dataLg: "stratos-kpi-slot__value",
  /** Inline metric */
  dataMd: "font-data text-[1.25rem] tabular-nums tracking-tight leading-none",
} as const;
