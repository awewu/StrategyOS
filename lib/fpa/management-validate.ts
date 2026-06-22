import type { MarginBridgeItem } from "@/lib/fpa/management-types";
import type { StatementsOverride } from "@/lib/fpa/management-adjustments-access";

const COLS = ["budget", "actual", "forecast"] as const;

export function validateMarginBridge(items: MarginBridgeItem[]): void {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("利润桥不能为空");
  }
  for (const item of items) {
    if (!item.label?.trim()) throw new Error("利润桥项缺少标签");
    if (typeof item.value !== "number" || Number.isNaN(item.value)) {
      throw new Error(`利润桥项「${item.label}」数值无效`);
    }
    if (typeof item.cumulative !== "number" || Number.isNaN(item.cumulative)) {
      throw new Error(`利润桥项「${item.label}」累计值无效`);
    }
  }
  const last = items.at(-1)!;
  if (!last.label.startsWith("=")) {
    throw new Error("利润桥末行应为合计（= 开头）");
  }
}

export function validateStatementsOverride(s: StatementsOverride): void {
  if (!s?.incomeStatement?.lines?.length || !s?.balanceSheet?.assets?.length || !s?.cashFlowStatement?.lines?.length) {
    throw new Error("三张表数据不完整");
  }

  for (const col of COLS) {
    const totalA = s.balanceSheet.assets.find((l) => l.key === "total_assets")?.[col];
    const totalL = s.balanceSheet.liabilities.find((l) => l.key === "total_liab")?.[col];
    const totalE = s.balanceSheet.equity.find((l) => l.key === "total_equity")?.[col];
    if (totalA == null || totalL == null || totalE == null) {
      throw new Error("资产负债表缺少合计行");
    }
    if (Math.abs(totalA - (totalL + totalE)) > 0.01) {
      throw new Error(
        `资产负债表 ${col} 不平衡：资产 ${totalA} ≠ 负债 ${totalL} + 权益 ${totalE}`,
      );
    }
  }
}
