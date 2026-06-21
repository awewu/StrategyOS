/**
 * FP&A 管理报表计算 · ROS / EBITDA / 三张表
 *
 * ROS 定义：净利润 ÷ 营业收入（销售净利率，Return on Sales）
 * EBITDA：息税折旧摊销前利润 = 毛利 − 营业费用（不含 D&A、利息、税）
 */
import type { FpaSummary } from "@/lib/types/stratos";
import type {
  BalanceSheet,
  CashFlowStatement,
  IncomeStatement,
  ManagementKpis,
  ManagementReportBundle,
  MarginBridgeItem,
  StatementLine,
} from "./management-types";

const PERIOD = "2026-FY";

export function computeRos(netIncome: number, revenue: number): number {
  if (revenue <= 0) return 0;
  return netIncome / revenue;
}

export function computeEbitdaMargin(ebitda: number, revenue: number): number {
  if (revenue <= 0) return 0;
  return ebitda / revenue;
}

/** 从 B-A-F 摘要推导完整管理报表（Demo / DB 共用锚点） */
export function buildManagementReport(
  fpa: FpaSummary,
  period = PERIOD
): ManagementReportBundle {
  const income = buildIncomeStatement(fpa, period);
  const kpis = extractKpis(income, period);
  const marginBridge = buildMarginBridge(income);
  const balanceSheet = buildBalanceSheet(fpa, period);
  const cashFlowStatement = buildCashFlowStatement(fpa, income, period);

  return {
    period,
    kpis,
    marginBridge,
    incomeStatement: income,
    balanceSheet,
    cashFlowStatement,
  };
}

function line(
  key: string,
  label: string,
  budget: number,
  actual: number,
  forecast: number,
  opts: { level?: number; emphasis?: boolean } = {}
): StatementLine {
  return { key, label, budget, actual, forecast, ...opts };
}

function buildIncomeStatement(fpa: FpaSummary, period: string): IncomeStatement {
  const revB = fpa.revenueBudget;
  const revA = fpa.revenueActual;
  const revF = fpa.revenueForecast;

  const cogsRatio = 0.7;
  const opexRatioB = 0.108;
  const opexRatioA = 0.127;
  const opexRatioF = 0.112;
  const daRatio = 0.032;
  const interestRatio = 0.009;
  const taxRate = 0.25;

  const cogs = (r: number) => Math.round(r * cogsRatio);
  const gross = (r: number, c: number) => r - c;
  const opex = (r: number, ratio: number) => Math.round(r * ratio);
  const ebitda = (g: number, o: number) => g - o;
  const da = (r: number) => Math.round(r * daRatio);
  const _ebit = (eb: number, d: number) => eb - d;
  const interest = (r: number) => Math.round(r * interestRatio);
  const _ebt = (eb: number, i: number) => eb - i;
  const tax = (e: number) => Math.round(Math.max(0, e) * taxRate);
  const net = (e: number, t: number) => e - t;

  const cB = cogs(revB);
  const cA = cogs(revA);
  const cF = cogs(revF);
  const gB = gross(revB, cB);
  const gA = gross(revA, cA);
  const gF = gross(revF, cF);
  const oB = opex(revB, opexRatioB);
  const oA = opex(revA, opexRatioA);
  const oF = opex(revF, opexRatioF);
  const _ebB = ebitda(gB, oB);
  const _ebA = ebitda(gA, oA);
  const _ebF = ebitda(gF, oF);
  const dB = da(revB);
  const dA = da(revA);
  const dF = da(revF);

  const profitAnchor = {
    budget: fpa.profitBudget,
    actual: fpa.profitActual,
    forecast: fpa.profitForecast,
  };
  const ebitB = profitAnchor.budget;
  const ebitA = profitAnchor.actual;
  const ebitF = profitAnchor.forecast;

  const iB = interest(revB);
  const iA = interest(revA);
  const iF = interest(revF);
  const ebtB = ebitB + iB;
  const ebtA = ebitA + iA;
  const ebtF = ebitF + iF;
  const tB = tax(ebtB);
  const tA = tax(ebtA);
  const tF = tax(ebtF);
  const nB = net(ebtB, tB);
  const nA = net(ebtA, tA);
  const nF = net(ebtF, tF);

  const ebBAdj = ebitB + dB;
  const ebAAdj = ebitA + dA;
  const ebFAdj = ebitF + dF;

  return {
    period,
    unit: "万元",
    lines: [
      line("revenue", "营业收入", revB, revA, revF, { emphasis: true }),
      line("cogs", "营业成本", cB, cA, cF, { level: 1 }),
      line("gross", "毛利", gB, gA, gF, { emphasis: true }),
      line("opex", "销售及管理费用", oB, oA, oF, { level: 1 }),
      line("ebitda", "EBITDA", ebBAdj, ebAAdj, ebFAdj, { emphasis: true }),
      line("da", "折旧及摊销", dB, dA, dF, { level: 1 }),
      line("ebit", "EBIT（营业利润）", ebitB, ebitA, ebitF, { emphasis: true }),
      line("interest", "财务费用", iB, iA, iF, { level: 1 }),
      line("ebt", "利润总额", ebtB, ebtA, ebtF),
      line("tax", "所得税", tB, tA, tF, { level: 1 }),
      line("net", "净利润", nB, nA, nF, { emphasis: true }),
    ],
  };
}

function findLine(income: IncomeStatement, key: string): StatementLine {
  const row = income.lines.find((l) => l.key === key);
  if (!row) throw new Error(`missing line ${key}`);
  return row;
}

function extractKpis(income: IncomeStatement, period: string): ManagementKpis {
  const rev = findLine(income, "revenue");
  const gross = findLine(income, "gross");
  const ebitda = findLine(income, "ebitda");
  const net = findLine(income, "net");

  return {
    period,
    rosActual: computeRos(net.actual, rev.actual),
    rosBudget: computeRos(net.budget, rev.budget),
    rosForecast: computeRos(net.forecast, rev.forecast),
    ebitdaActual: ebitda.actual,
    ebitdaBudget: ebitda.budget,
    ebitdaForecast: ebitda.forecast,
    ebitdaMarginActual: computeEbitdaMargin(ebitda.actual, rev.actual),
    ebitdaMarginBudget: computeEbitdaMargin(ebitda.budget, rev.budget),
    ebitdaMarginForecast: computeEbitdaMargin(ebitda.forecast, rev.forecast),
    grossMarginActual: computeRos(gross.actual, rev.actual),
    grossMarginBudget: computeRos(gross.budget, rev.budget),
    grossMarginForecast: computeRos(gross.forecast, rev.forecast),
  };
}

function buildMarginBridge(income: IncomeStatement): MarginBridgeItem[] {
  const rev = findLine(income, "revenue");
  const cogs = findLine(income, "cogs");
  const opex = findLine(income, "opex");
  const da = findLine(income, "da");
  const net = findLine(income, "net");

  const items: MarginBridgeItem[] = [
    { label: "营业收入", value: rev.actual, cumulative: rev.actual },
    { label: "− 营业成本", value: -cogs.actual, cumulative: rev.actual - cogs.actual },
    { label: "− 销售及管理费用", value: -opex.actual, cumulative: rev.actual - cogs.actual - opex.actual },
    { label: "− 折旧及摊销", value: -da.actual, cumulative: rev.actual - cogs.actual - opex.actual - da.actual },
  ];
  const last = items[items.length - 1].cumulative;
  items.push({
    label: "= 净利润（ROS 分子）",
    value: net.actual - last,
    cumulative: net.actual,
  });
  return items;
}

function buildBalanceSheet(fpa: FpaSummary, period: string): BalanceSheet {
  const rev = fpa.revenueActual;
  const cash = Math.round(rev * 0.41);
  const ar = Math.round(rev * 0.35);
  const inv = Math.round(rev * 0.47);
  const fixed = Math.round(rev * 1.68);
  const totalAssets = cash + ar + inv + fixed;

  const ap = Math.round(rev * 0.23);
  const debt = Math.round(rev * 0.88);
  const otherLiab = Math.round(rev * 0.16);
  const totalLiab = ap + debt + otherLiab;
  const equity = totalAssets - totalLiab;

  const mk = (key: string, label: string, v: number, level?: number) =>
    line(key, label, v, v, v, { level, emphasis: key.startsWith("total") });

  return {
    period,
    unit: "万元",
    assets: [
      mk("cash", "货币资金", cash, 1),
      mk("ar", "应收账款", ar, 1),
      mk("inv", "存货", inv, 1),
      mk("fixed", "固定资产及在建", fixed, 1),
      mk("total_assets", "资产合计", totalAssets),
    ],
    liabilities: [
      mk("ap", "应付账款", ap, 1),
      mk("debt", "有息负债", debt, 1),
      mk("other_liab", "其他负债", otherLiab, 1),
      mk("total_liab", "负债合计", totalLiab),
    ],
    equity: [
      mk("paid_in", "实收资本及公积", Math.round(equity * 0.62), 1),
      mk("retained", "未分配利润", Math.round(equity * 0.38), 1),
      mk("total_equity", "所有者权益合计", equity),
    ],
  };
}

function buildCashFlowStatement(
  fpa: FpaSummary,
  income: IncomeStatement,
  period: string
): CashFlowStatement {
  const net = findLine(income, "net");
  const da = findLine(income, "da");
  const wcChange = Math.round(fpa.revenueActual * 0.023);
  const cfo = net.actual + da.actual - wcChange;
  const capex = -Math.round(fpa.revenueActual * 0.176);
  const cfi = capex;
  const cff = Math.round(fpa.revenueActual * -0.039);
  const netChange = cfo + cfi + cff;
  const opening = Math.round(fpa.revenueActual * 0.49);
  const closing = opening + netChange;

  return {
    period,
    unit: "万元",
    lines: [
      line("cfo", "经营活动现金流净额", cfo, cfo, cfo, { emphasis: true }),
      line("cfo_net", "  净利润", net.budget, net.actual, net.forecast, { level: 1 }),
      line("cfo_da", "  加：折旧摊销", da.budget, da.actual, da.forecast, { level: 1 }),
      line("cfo_wc", "  减：营运资本增加", wcChange, wcChange, wcChange, { level: 1 }),
      line("cfi", "投资活动现金流净额", cfi, cfi, cfi, { emphasis: true }),
      line("cfi_capex", "  资本支出（CAPEX）", capex, capex, capex, { level: 1 }),
      line("cff", "筹资活动现金流净额", cff, cff, cff, { emphasis: true }),
      line("net_change", "现金净增加额", netChange, netChange, netChange, { emphasis: true }),
      line("opening", "期初现金", opening, opening, opening, { level: 1 }),
      line("closing", "期末现金", closing, closing, closing, { emphasis: true }),
    ],
  };
}

export const demoManagementReport = buildManagementReport(
  {
    revenueBudget: 6000,
    revenueActual: 5120,
    revenueForecast: 5800,
    profitBudget: 880,
    profitActual: 720,
    profitForecast: 820,
    cashRunwayMonths: 2.1,
  },
  PERIOD
);
