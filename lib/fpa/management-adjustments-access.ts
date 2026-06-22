import { asDbJson, dbAvailable, prisma, safeDbQuery } from "@/lib/db";
import { Prisma } from "@prisma/client";
import type {
  BalanceSheet,
  CashFlowStatement,
  IncomeStatement,
  MarginBridgeItem,
} from "@/lib/fpa/management-types";
import { getActivePeriod } from "@/lib/data/active-period";

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
  period?: string,
): Promise<ManagementAdjustmentsBundle> {
  const activePeriod = period ?? await getActivePeriod();
  const fallback: ManagementAdjustmentsBundle = {
    marginBridge: null,
    statements: null,
    marginBridgeSource: "derived",
    statementsSource: "derived",
  };
  if (!(await dbAvailable())) return fallback;
  return safeDbQuery(async () => {
    const row = await prisma.strategicManagementAdjustments.findUnique({ where: { period: activePeriod } });
    if (!row) return fallback;
    return {
      marginBridge: row.marginBridgeJson
        ? parseMarginBridgeJson(row.marginBridgeJson)
        : null,
      statements: row.statementsJson ? parseStatementsJson(row.statementsJson) : null,
      marginBridgeSource: row.marginBridgeJson ? ("database" as const) : ("derived" as const),
      statementsSource: row.statementsJson ? ("database" as const) : ("derived" as const),
    };
  }, fallback);
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
  period?: string,
): Promise<ManagementAdjustmentsBundle> {
  const activePeriod = period ?? await getActivePeriod();
  if (!(await dbAvailable())) throw new Error("DATABASE_URL unset — 无法保存管理报表调整");
  if (marginBridge.length === 0) throw new Error("利润桥不能为空");
  await upsertRow(activePeriod);
  await prisma.strategicManagementAdjustments.update({
    where: { period: activePeriod },
    data: { marginBridgeJson: asDbJson(marginBridge) },
  });
  return getManagementAdjustments(activePeriod);
}

export async function saveManagementStatements(
  statements: StatementsOverride,
  period?: string,
): Promise<ManagementAdjustmentsBundle> {
  const activePeriod = period ?? await getActivePeriod();
  if (!(await dbAvailable())) throw new Error("DATABASE_URL unset — 无法保存三张表");
  await upsertRow(activePeriod);
  await prisma.strategicManagementAdjustments.update({
    where: { period: activePeriod },
    data: { statementsJson: asDbJson(statements) },
  });
  return getManagementAdjustments(activePeriod);
}

export async function clearManagementMarginBridge(period?: string): Promise<void> {
  const activePeriod = period ?? await getActivePeriod();
  if (!(await dbAvailable())) return;
  const row = await prisma.strategicManagementAdjustments.findUnique({ where: { period: activePeriod } });
  if (!row) return;
  await prisma.strategicManagementAdjustments.update({
    where: { period: activePeriod },
    data: { marginBridgeJson: Prisma.DbNull },
  });
}

export async function clearManagementStatements(period?: string): Promise<void> {
  const activePeriod = period ?? await getActivePeriod();
  if (!(await dbAvailable())) return;
  const row = await prisma.strategicManagementAdjustments.findUnique({ where: { period: activePeriod } });
  if (!row) return;
  await prisma.strategicManagementAdjustments.update({
    where: { period: activePeriod },
    data: { statementsJson: Prisma.DbNull },
  });
}

export async function clearAllManagementAdjustments(period?: string): Promise<void> {
  const activePeriod = period ?? await getActivePeriod();
  if (!(await dbAvailable())) return;
  await prisma.strategicManagementAdjustments.deleteMany({ where: { period: activePeriod } });
}
