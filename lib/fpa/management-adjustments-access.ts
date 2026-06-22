import { dbAvailable, prisma } from "@/lib/db";
import type {
  BalanceSheet,
  CashFlowStatement,
  IncomeStatement,
  MarginBridgeItem,
} from "@/lib/fpa/management-types";
import * as demo from "@/lib/stratos-demo-data";

export type StatementsOverride = {
  incomeStatement: IncomeStatement;
  balanceSheet: BalanceSheet;
  cashFlowStatement: CashFlowStatement;
};

export type ManagementAdjustmentsBundle = {
  marginBridge: MarginBridgeItem[] | null;
  statements: StatementsOverride | null;
  marginBridgeSource: "database" | "derived";
  statementsSource: "database" | "derived";
};

export function parseMarginBridgeJson(json: unknown): MarginBridgeItem[] {
  const items = json as MarginBridgeItem[];
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("利润桥数据格式无效");
  }
  return items;
}

export function parseStatementsJson(json: unknown): StatementsOverride {
  const s = json as StatementsOverride;
  if (!s?.incomeStatement?.lines || !s?.balanceSheet?.assets || !s?.cashFlowStatement?.lines) {
    throw new Error("三张表数据格式无效");
  }
  return s;
}

export async function getManagementAdjustments(
  period = demo.CURRENT_PERIOD,
): Promise<ManagementAdjustmentsBundle> {
  if (!(await dbAvailable())) {
    return {
      marginBridge: null,
      statements: null,
      marginBridgeSource: "derived",
      statementsSource: "derived",
    };
  }
  const row = await prisma.strategicManagementAdjustments.findUnique({ where: { period } });
  if (!row) {
    return {
      marginBridge: null,
      statements: null,
      marginBridgeSource: "derived",
      statementsSource: "derived",
    };
  }
  return {
    marginBridge: row.marginBridgeJson
      ? parseMarginBridgeJson(row.marginBridgeJson)
      : null,
    statements: row.statementsJson ? parseStatementsJson(row.statementsJson) : null,
    marginBridgeSource: row.marginBridgeJson ? "database" : "derived",
    statementsSource: row.statementsJson ? "database" : "derived",
  };
}

async function upsertRow(period: string) {
  return prisma.strategicManagementAdjustments.upsert({
    where: { period },
    create: { period },
    update: {},
  });
}

export async function saveManagementMarginBridge(
  marginBridge: MarginBridgeItem[],
  period = demo.CURRENT_PERIOD,
): Promise<ManagementAdjustmentsBundle> {
  if (!(await dbAvailable())) throw new Error("DATABASE_URL unset — 无法保存管理报表调整");
  if (marginBridge.length === 0) throw new Error("利润桥不能为空");
  await upsertRow(period);
  await prisma.strategicManagementAdjustments.update({
    where: { period },
    data: { marginBridgeJson: marginBridge },
  });
  return getManagementAdjustments(period);
}

export async function saveManagementStatements(
  statements: StatementsOverride,
  period = demo.CURRENT_PERIOD,
): Promise<ManagementAdjustmentsBundle> {
  if (!(await dbAvailable())) throw new Error("DATABASE_URL unset — 无法保存三张表");
  await upsertRow(period);
  await prisma.strategicManagementAdjustments.update({
    where: { period },
    data: { statementsJson: statements },
  });
  return getManagementAdjustments(period);
}

export async function clearManagementMarginBridge(period = demo.CURRENT_PERIOD): Promise<void> {
  if (!(await dbAvailable())) return;
  const row = await prisma.strategicManagementAdjustments.findUnique({ where: { period } });
  if (!row) return;
  await prisma.strategicManagementAdjustments.update({
    where: { period },
    data: { marginBridgeJson: null },
  });
}

export async function clearManagementStatements(period = demo.CURRENT_PERIOD): Promise<void> {
  if (!(await dbAvailable())) return;
  const row = await prisma.strategicManagementAdjustments.findUnique({ where: { period } });
  if (!row) return;
  await prisma.strategicManagementAdjustments.update({
    where: { period },
    data: { statementsJson: null },
  });
}

export async function clearAllManagementAdjustments(period = demo.CURRENT_PERIOD): Promise<void> {
  if (!(await dbAvailable())) return;
  await prisma.strategicManagementAdjustments.deleteMany({ where: { period } });
}
