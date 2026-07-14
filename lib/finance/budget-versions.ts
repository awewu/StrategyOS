import { dbAvailable, prisma } from "@/lib/db";
import type { FinBudgetStatus } from "@prisma/client";

export interface BudgetVersionView {
  id: string;
  fiscalYear: string;
  name: string;
  scenarioCode: string | null;
  status: FinBudgetStatus;
  notes: string | null;
  createdBy: string | null;
  submittedAt: string | null;
  submittedBy: string | null;
  decidedAt: string | null;
  decidedBy: string | null;
  decisionNote: string | null;
  createdAt: string;
}

export type BudgetAction = "submit" | "approve" | "reject" | "revise";

/** 状态机：草案→上报→批准/退回；退回可修订回草案；批准为终态 */
const TRANSITIONS: Record<BudgetAction, { from: FinBudgetStatus[]; to: FinBudgetStatus }> = {
  submit: { from: ["draft"], to: "submitted" },
  approve: { from: ["submitted"], to: "approved" },
  reject: { from: ["submitted"], to: "rejected" },
  revise: { from: ["rejected"], to: "draft" },
};

function toView(v: {
  id: string;
  fiscalYear: string;
  name: string;
  scenarioCode: string | null;
  status: FinBudgetStatus;
  notes: string | null;
  createdBy: string | null;
  submittedAt: Date | null;
  submittedBy: string | null;
  decidedAt: Date | null;
  decidedBy: string | null;
  decisionNote: string | null;
  createdAt: Date;
}): BudgetVersionView {
  return {
    ...v,
    submittedAt: v.submittedAt?.toISOString() ?? null,
    decidedAt: v.decidedAt?.toISOString() ?? null,
    createdAt: v.createdAt.toISOString(),
  };
}

export async function listBudgetVersions(): Promise<BudgetVersionView[]> {
  if (!(await dbAvailable())) return [];
  const rows = await prisma.finBudgetVersion.findMany({
    orderBy: [{ fiscalYear: "desc" }, { createdAt: "desc" }],
  });
  return rows.map(toView);
}

export async function createBudgetVersion(input: {
  fiscalYear: string;
  name: string;
  scenarioCode?: string | null;
  notes?: string | null;
  createdBy?: string | null;
}): Promise<BudgetVersionView> {
  if (!/^\d{4}$/.test(input.fiscalYear)) throw new Error("财年格式应为 YYYY");
  if (!input.name.trim()) throw new Error("版本名称不能为空");
  const row = await prisma.finBudgetVersion.create({
    data: {
      fiscalYear: input.fiscalYear,
      name: input.name.trim(),
      scenarioCode: input.scenarioCode?.trim() || null,
      notes: input.notes?.trim() || null,
      createdBy: input.createdBy ?? null,
    },
  });
  return toView(row);
}

/** 纯函数：当前状态下某操作是否合法，合法则返回目标状态 */
export function canTransition(status: FinBudgetStatus, action: BudgetAction): FinBudgetStatus | null {
  const rule = TRANSITIONS[action];
  if (!rule || !rule.from.includes(status)) return null;
  return rule.to;
}

export async function transitionBudgetVersion(input: {
  id: string;
  action: BudgetAction;
  actor?: string | null;
  note?: string | null;
}): Promise<BudgetVersionView> {
  const current = await prisma.finBudgetVersion.findUnique({ where: { id: input.id } });
  if (!current) throw new Error("预算版本不存在");
  if (!canTransition(current.status, input.action)) {
    throw new Error(`当前状态 ${current.status} 不允许 ${input.action}`);
  }
  const rule = TRANSITIONS[input.action];
  const now = new Date();
  const row = await prisma.finBudgetVersion.update({
    where: { id: input.id },
    data:
      input.action === "submit"
        ? { status: rule.to, submittedAt: now, submittedBy: input.actor ?? null }
        : input.action === "revise"
          ? { status: rule.to, decidedAt: null, decidedBy: null, decisionNote: null }
          : {
              status: rule.to,
              decidedAt: now,
              decidedBy: input.actor ?? null,
              decisionNote: input.note?.trim() || null,
            },
  });
  // 批准即挂基准：该财年的管理报表 B 基准指向此版本（单一权威来源）
  if (input.action === "approve") {
    await prisma.systemSetting.upsert({
      where: { key: `budget_baseline_${row.fiscalYear}` },
      create: { key: `budget_baseline_${row.fiscalYear}`, value: row.id },
      update: { value: row.id },
    });
  }
  return toView(row);
}

/** 财年 B 基准：最后一个被批准并挂基准的预算版本；null = 基准未建立 */
export async function getBudgetBaseline(fiscalYear: string): Promise<BudgetVersionView | null> {
  if (!(await dbAvailable())) return null;
  const setting = await prisma.systemSetting.findUnique({
    where: { key: `budget_baseline_${fiscalYear}` },
  });
  if (!setting) return null;
  const row = await prisma.finBudgetVersion.findUnique({ where: { id: setting.value } });
  if (!row || row.status !== "approved") return null;
  return toView(row);
}
