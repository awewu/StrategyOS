/** User-visible labels for internal domain types (ProductBet / GtmBet). */
export const displayLabels = {
  productBet: "产品战略项",
  productBets: "产品战略项",
  gtmBet: "市场战略项",
  gtmBets: "市场战略项",
  threeStack: "三栈资源配置",
  capitalStack: "资本投向",
} as const;

export type DisplayLabelKey = keyof typeof displayLabels;

export function labelFor(key: DisplayLabelKey): string {
  return displayLabels[key];
}
