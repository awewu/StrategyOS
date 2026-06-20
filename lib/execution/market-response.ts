/**
 * 市场-执行对照层
 * 每个槽位固定存在；未录入 = 对市场缺乏把控
 */

export type MarketVerdict = "effective" | "assumption_failed" | "inconclusive" | "empty";

export interface MarketEvidence {
  id: string;
  /** 对应的战略行动（链接 ProjectCode / BetTitle） */
  actionLabel: string;
  actionCode?: string;
  /** 对应的战略假设 */
  linkedAssumptionCode?: string;
  /** 市场证据：谁录入、什么时候、来源 */
  evidenceText: string | null;   // null = 待录入
  evidenceSource: string | null; // 来源说明（如「客户访谈 2026-05」）
  recordedBy: string | null;
  recordedAt: string | null;
  /** 执行判定 */
  verdict: MarketVerdict;
  verdictNote: string | null;
}

export interface CompetitivePosition {
  id: string;
  competitor: string;
  dimension: string;               // 「华东酒店渠道签约量」
  ourValue: string | null;         // null = 待录入
  theirValue: string | null;
  period: string;
  delta: string | null;            // 「我们落后 220 家」
  evidenceSource: string | null;
  recordedBy: string | null;
  recordedAt: string | null;
}

// ─── Demo 数据：部分已录入，部分故意留空展示「缺失即预警」─────────────────

export const demoMarketResponses: MarketEvidence[] = [
  {
    id: "mr1",
    actionLabel: "攻酒店渠道（华东）",
    actionCode: "V1",
    linkedAssumptionCode: "H5",
    evidenceText: "Q2 华东酒店新签 62 家，同期史密斯约 300 家。渠道容量约 2000 家，我方渗透率 3.1%。",
    evidenceSource: "销售周报 2026-06-10 · 竞品调研",
    recordedBy: "毕韬",
    recordedAt: "2026-06-12",
    verdict: "assumption_failed",
    verdictNote: "假设 H5（年签约 ≥1200 家）按当前速度无法兑现，市场竞争强度高于预期",
  },
  {
    id: "mr2",
    actionLabel: "V4 热泵产品化上市",
    actionCode: "V4",
    linkedAssumptionCode: "H2",
    evidenceText: null,
    evidenceSource: null,
    recordedBy: null,
    recordedAt: null,
    verdict: "empty",
    verdictNote: null,
  },
  {
    id: "mr3",
    actionLabel: "RUUD 价格执行（不跟降）",
    actionCode: undefined,
    linkedAssumptionCode: "H2",
    evidenceText: "Q2 RUUD ASP +2.1% vs Q1，史密斯同期下调 3%。溢价守住，但导致部分价格敏感客户流失约 8%。",
    evidenceSource: "财务月报 2026-05 · 客户流失分析",
    recordedBy: "CFO",
    recordedAt: "2026-06-05",
    verdict: "effective",
    verdictNote: "价格策略有效，但需监控客户流失率是否持续扩大",
  },
  {
    id: "mr4",
    actionLabel: "恒热华南区县级渠道下沉",
    actionCode: "V1",
    evidenceText: null,
    evidenceSource: null,
    recordedBy: null,
    recordedAt: null,
    verdict: "empty",
    verdictNote: null,
  },
  {
    id: "mr5",
    actionLabel: "区域 M&A 标的市场格局",
    actionCode: "V6",
    linkedAssumptionCode: "H2",
    evidenceText: null,
    evidenceSource: null,
    recordedBy: null,
    recordedAt: null,
    verdict: "empty",
    verdictNote: null,
  },
];

export const demoCompetitivePositions: CompetitivePosition[] = [
  {
    id: "cp1",
    competitor: "史密斯",
    dimension: "华东酒店渠道签约量（Q2）",
    ourValue: "62 家",
    theirValue: "约 300 家",
    period: "2026-Q2",
    delta: "落后 238 家 (-79%)",
    evidenceSource: "竞品调研 2026-06",
    recordedBy: "毕韬",
    recordedAt: "2026-06-12",
  },
  {
    id: "cp2",
    competitor: "博世",
    dimension: "华东热泵产品 ASP",
    ourValue: "¥18,200",
    theirValue: null,
    period: "2026-Q2",
    delta: null,
    evidenceSource: null,
    recordedBy: null,
    recordedAt: null,
  },
  {
    id: "cp3",
    competitor: "史密斯",
    dimension: "全国营收增速（YoY）",
    ourValue: null,
    theirValue: null,
    period: "2026-Q2",
    delta: null,
    evidenceSource: null,
    recordedBy: null,
    recordedAt: null,
  },
  {
    id: "cp4",
    competitor: "林内",
    dimension: "华南家用热水器市占率",
    ourValue: null,
    theirValue: null,
    period: "2026-Q2",
    delta: null,
    evidenceSource: null,
    recordedBy: null,
    recordedAt: null,
  },
];
