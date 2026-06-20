export interface TwelveDimension {
  id: string;
  name: string;
  pillar: "commitment" | "values" | "operations";
  weight: number;
  score: number;
  signal: "green" | "yellow" | "red";
}

/** Phase 2 · 十二维 — 战略部下钻（CEO 仍看四维+8 KPI） */
export const twelveDimensions: TwelveDimension[] = [
  { id: "d1", name: "承诺兑现率", pillar: "commitment", weight: 12, score: 70, signal: "yellow" },
  { id: "d2", name: "Doctrine 审计通过", pillar: "commitment", weight: 10, score: 85, signal: "green" },
  { id: "d3", name: "个人承诺逾期率", pillar: "commitment", weight: 8, score: 75, signal: "yellow" },
  { id: "d4", name: "使命愿景一致性", pillar: "values", weight: 8, score: 90, signal: "green" },
  { id: "d5", name: "四满意调研", pillar: "values", weight: 9, score: 82, signal: "green" },
  { id: "d6", name: "文化事件响应", pillar: "values", weight: 8, score: 78, signal: "green" },
  { id: "d7", name: "财务 B-A-F", pillar: "operations", weight: 10, score: 68, signal: "yellow" },
  { id: "d8", name: "客户 NPS/覆盖", pillar: "operations", weight: 8, score: 88, signal: "green" },
  { id: "d9", name: "流程准时率", pillar: "operations", weight: 7, score: 65, signal: "red" },
  { id: "d10", name: "产品 Roadmap 聚焦", pillar: "operations", weight: 6, score: 80, signal: "green" },
  { id: "d11", name: "投资/CAPEX 执行", pillar: "operations", weight: 5, score: 72, signal: "yellow" },
  { id: "d12", name: "风险/合规", pillar: "operations", weight: 9, score: 55, signal: "red" },
];

export const pillarLabels = {
  commitment: "承诺兑现 30%",
  values: "价值观 25%",
  operations: "业务运营 45%",
} as const;

export function compositeTwelveDimScore(dims = twelveDimensions): number {
  const total = dims.reduce((s, d) => s + d.score * d.weight, 0);
  const weights = dims.reduce((s, d) => s + d.weight, 0);
  return Math.round(total / weights);
}
