/** FP&A 管理报表 · 利润表 / 资产负债表 / 现金流量表 */

export type StatementColumn = "budget" | "actual" | "forecast";

export interface StatementLine {
  key: string;
  label: string;
  budget: number;
  actual: number;
  forecast: number;
  /** 缩进层级 0=主行 1=子行 */
  level?: number;
  emphasis?: boolean;
}

export interface IncomeStatement {
  period: string;
  unit: "万元";
  lines: StatementLine[];
}

export interface BalanceSheet {
  period: string;
  unit: "万元";
  assets: StatementLine[];
  liabilities: StatementLine[];
  equity: StatementLine[];
}

export interface CashFlowStatement {
  period: string;
  unit: "万元";
  lines: StatementLine[];
}

/** 管理报表 KPI · ROS = 净利润/营收（销售净利率） */
export interface ManagementKpis {
  period: string;
  /** ROS = Net Income / Revenue */
  rosActual: number;
  rosBudget: number;
  rosForecast: number;
  ebitdaActual: number;
  ebitdaBudget: number;
  ebitdaForecast: number;
  ebitdaMarginActual: number;
  ebitdaMarginBudget: number;
  ebitdaMarginForecast: number;
  grossMarginActual: number;
  grossMarginBudget: number;
  grossMarginForecast: number;
}

export interface MarginBridgeItem {
  label: string;
  value: number;
  /** cumulative from revenue */
  cumulative: number;
}

export interface ManagementReportBundle {
  period: string;
  kpis: ManagementKpis;
  marginBridge: MarginBridgeItem[];
  incomeStatement: IncomeStatement;
  balanceSheet: BalanceSheet;
  cashFlowStatement: CashFlowStatement;
}
