/**
 * McKinsey strategic review patterns + Apple-inspired UI labels for StratOS.
 * Not Apple branding — clarity, deference, depth, restraint.
 * @see docs/MCKINSEY_STRATEGY_FRAMEWORK.md · docs/UI_VI_EVOLUTION.md §Apple × McKinsey
 */

export const mckinseyCadence = {
  preRead: { route: "/reports", labelZh: "预读 · 月报/季报入库" },
  discussion: { route: "/command", labelZh: "讨论 · 指挥舱 SCR + KPI" },
  decision: { route: "/versions", labelZh: "决策 · 版本快照与 diff" },
  followUp: { route: "/print/panorama", labelZh: "跟进 · 董事会 A3 全景" },
} as const;

export const mckinseySections = {
  scr: {
    situation: { id: "S", labelZh: "背景", labelEn: "Situation" },
    complication: { id: "C", labelZh: "症结", labelEn: "Complication" },
    resolution: { id: "R", labelZh: "建议", labelEn: "Resolution" },
  },
  keyIssues: { id: "MECE", labelZh: "关键议题", labelEn: "Key Issues", hint: "MECE 议题树 · 互斥穷尽" },
  implications: { id: "SO", labelZh: "启示", labelEn: "Implications", hint: "So what · 对决策的含义" },
  decisions: { id: "DEC", labelZh: "待决事项", labelEn: "Decisions", hint: "owner · deadline · trade-off" },
} as const;

/** Optional McKinsey header block — prepended to MON-RPT without replacing §1–§8 */
export const mckinseyReportHeaderTemplate = `# McKinsey 叙事头（可选 · 置于 MON-RPT 正文前）

§S 背景 · Situation
<30–60 字：稳定事实与 scope>

§C 症结 · Complication
<变化/风险/缺口 — 为何现在必须讨论>

§R 建议 · Resolution
<结论先行 · 占 60–70% 篇幅>

§MECE 关键议题
- 议题 1：<互斥子问题>
- 议题 2：<…>

§So what 启示
- <每条 chart/段落结尾的可执行含义>

§Decisions 待决
- [ ] <决策项> · owner · deadline
`;

export const monRptPasteGuide = [
  "§1 本月一句话（≤50 字）",
  "§2–§7 MON-RPT 固定七章",
  "§8 涌现 / 战略模式",
  "可选：§S / §C / §R / §MECE / §So what / §Decisions",
] as const;

export const appleSurfaces = {
  cardPadding: "var(--space-card, 1.5rem)",
  sectionGap: "var(--space-section, 2rem)",
  borderSubtle: "border-white/[0.06]",
  borderFocus: "border-[var(--color-accent)]/35",
  glass: "surface-glass",
  elevated: "surface-elevated",
} as const;

export const appleTypography = {
  /** Tight tracking on labels — SF-like rhythm */
  label: "text-[11px] font-medium uppercase tracking-[0.08em]",
  /** Relaxed on headlines */
  headline: "text-[2rem] font-semibold leading-[1.15] tracking-[-0.02em]",
  bodyQuiet: "text-[15px] leading-[1.6] text-[var(--color-text-primary)]/90",
} as const;
