export type GateStatus = "pass" | "fail" | "partial";

export interface GateItem {
  id: string;
  label: string;
  status: GateStatus;
  note?: string;
}

export interface GateChecklist {
  id: string;
  title: string;
  doctrine?: string;
  items: GateItem[];
}

export const gateChecklists: GateChecklist[] = [
  {
    id: "invest",
    title: "Invest Gate · 资本战略会",
    doctrine: "Invest to Growth",
    items: [
      { id: "ic-okr", label: "投资案挂 OKR-O 或 Diagnosis.crux", status: "pass" },
      { id: "ic-hx", label: "每条 IC 有 ≥1 条战略假设 Hx", status: "pass" },
      { id: "ic-irr", label: "IRR 超门槛或 CEO 例外记录", status: "pass" },
      { id: "ic-runway", label: "不击穿 CapStack 现金波峰后 runway", status: "fail", note: "波峰后 runway 2.8 月，IC-04 待批" },
      { id: "ic-budget-tag", label: "approved IC 必填 budget_tag", status: "pass" },
      { id: "ic-vx-owner", label: "资本类 Vx 有 Owner", status: "pass" },
      { id: "ic-wushi", label: "五事「将/法」检查通过或风险已列", status: "partial", note: "IC-04 将/法待补" },
    ],
  },
  {
    id: "innovate",
    title: "Innovate Gate · 产品战略会",
    doctrine: "Innovate to Lead",
    items: [
      { id: "pb-jtbd", label: "每条 H2/H3 产品战略项有 JTBD", status: "pass" },
      { id: "rd-now5", label: "Roadmap Now 项 ≤5", status: "pass" },
      { id: "gap-vx", label: "每条 lagging Gap 有 Vx 或 defer", status: "pass" },
      { id: "h3-ratio", label: "H3 占比 vs 研发/CAPEX 可解释", status: "partial", note: "H3 10% 需在战略会说明" },
      { id: "wtp-align", label: "与 WTP/HTW 无矛盾", status: "pass" },
      { id: "crux-align", label: "与 Diagnosis.crux 对齐", status: "pass" },
      { id: "hx-revenue", label: "新品收入占比假设 Hx 已绑定", status: "pass" },
      { id: "kill-criteria", label: "H3 赌注有 kill_criteria", status: "pass" },
    ],
  },
  {
    id: "deliver",
    title: "Deliver Gate · 渠道/客户战略会",
    doctrine: "Deliver on Commitment",
    items: [
      { id: "seg-bet", label: "每个 focus 段有市场战略项或 OKR-KR", status: "pass" },
      { id: "cell-coverage", label: "P0 BrandChannelCell 有 coverage 三态", status: "pass" },
      { id: "bet-hx", label: "市场战略项有 ≥1 条 Hx", status: "pass" },
      { id: "ltv-cac", label: "段级 LTV:CAC 非红或已有修正 Vx", status: "partial", note: "酒店段 LTV:CAC 黄" },
      { id: "gtm-now5", label: "Now 泳道 Gtm 动作 ≤5", status: "pass" },
      { id: "prod-align", label: "与 ProdStack / WTP 无矛盾", status: "pass" },
      { id: "ic-peak", label: "渠道 IC 与 CapStack 现金波峰一致", status: "pass" },
      { id: "roadmap-deliver", label: "Deliver 承诺与 GtmRoadmap 一致", status: "pass" },
    ],
  },
  {
    id: "wushi",
    title: "五事七计 · 定性 Gate",
    items: [
      { id: "dao", label: "道 — 与使命愿景一致", status: "pass" },
      { id: "tian", label: "天 — 时机与宏观窗口", status: "pass" },
      { id: "di", label: "地 — 市场/区域根基", status: "pass" },
      { id: "jiang", label: "将 — 负责人与能力", status: "partial", note: "V6 未启动" },
      { id: "fa", label: "法 — 组织与流程就绪", status: "pass" },
    ],
  },
];

export function gateRiskItems(checklist: GateChecklist): GateItem[] {
  return checklist.items.filter((i) => i.status !== "pass");
}

export function gateSummary(): { pass: number; fail: number; partial: number } {
  let pass = 0;
  let fail = 0;
  let partial = 0;
  for (const g of gateChecklists) {
    for (const i of g.items) {
      if (i.status === "pass") pass++;
      else if (i.status === "fail") fail++;
      else partial++;
    }
  }
  return { pass, fail, partial };
}
