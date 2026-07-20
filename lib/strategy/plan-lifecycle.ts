import { prisma } from "@/lib/db";
import type { PlanStatus } from "@prisma/client";
import { DEFAULT_GROUP_ORG_UNIT_ID } from "@/lib/data/strategic-plan-data";
import { writePlanSnapshot, promoteLatestSnapshotToLocked } from "@/lib/strategy/plan-snapshot";

export const PLAN_HORIZON_START = 2026;
export const PLAN_HORIZON_END = 2028;

export type PlanLifecycleAction = "submit" | "lock" | "reopen";

export type PlanLifecycleView = {
  planId: string;
  orgUnitId: string;
  status: PlanStatus;
  lockedAt: string | null;
  submittedAt: string | null;
  objectiveCount: number;
  keyResultCount: number;
  canEdit: boolean;
  canSubmit: boolean;
  canLock: boolean;
  canReopen: boolean;
};

export function planStatusLabel(status: PlanStatus): string {
  switch (status) {
    case "DRAFT":
      return "草稿";
    case "SUBMITTED":
      return "已提交";
    case "LOCKED":
      return "已定稿锁定";
    default:
      return status;
  }
}

export async function fetchPlanLifecycle(
  orgUnitId: string = DEFAULT_GROUP_ORG_UNIT_ID,
  horizonStart = PLAN_HORIZON_START,
  horizonEnd = PLAN_HORIZON_END,
): Promise<PlanLifecycleView | null> {
  const plan = await prisma.strategicPlan.findFirst({
    where: { orgUnitId, horizonStart, horizonEnd },
    select: {
      id: true,
      orgUnitId: true,
      status: true,
      lockedAt: true,
      submittedAt: true,
      _count: { select: { objectives: true } },
    },
  });
  if (!plan) return null;

  const keyResultCount = await prisma.planKeyResult.count({
    where: { objective: { planId: plan.id } },
  });

  return {
    planId: plan.id,
    orgUnitId: plan.orgUnitId,
    status: plan.status,
    lockedAt: plan.lockedAt?.toISOString() ?? null,
    submittedAt: plan.submittedAt?.toISOString() ?? null,
    objectiveCount: plan._count.objectives,
    keyResultCount,
    canEdit: plan.status !== "LOCKED",
    canSubmit: plan.status === "DRAFT",
    // 收紧：仅已提交计划可定稿锁定，确保锁定时已存在完整快照可提升为 LOCKED。
    canLock: plan.status === "SUBMITTED",
    canReopen: plan.status === "LOCKED",
  };
}

export async function assertPlanWritable(
  planId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const plan = await prisma.strategicPlan.findUnique({
    where: { id: planId },
    select: { status: true },
  });
  if (plan?.status === "LOCKED") {
    return {
      ok: false,
      error: "计划已定稿锁定，无法写入。请先在战略页「重新打开」或联系管理员。",
    };
  }
  return { ok: true };
}

export async function transitionPlanLifecycle(input: {
  orgUnitId: string;
  horizonStart?: number;
  horizonEnd?: number;
  action: PlanLifecycleAction;
  submitterId?: string | null;
}): Promise<{ ok: true; status: PlanStatus } | { ok: false; error: string }> {
  const horizonStart = input.horizonStart ?? PLAN_HORIZON_START;
  const horizonEnd = input.horizonEnd ?? PLAN_HORIZON_END;

  const plan = await prisma.strategicPlan.findFirst({
    where: { orgUnitId: input.orgUnitId, horizonStart, horizonEnd },
    select: {
      id: true,
      status: true,
      intent: true,
      northStar: true,
      _count: { select: { objectives: true } },
    },
  });

  if (!plan) {
    return { ok: false, error: "未找到战略计划" };
  }

  const now = new Date();

  if (input.action === "submit") {
    if (plan.status !== "DRAFT") {
      return { ok: false, error: "仅草稿状态可提交审核" };
    }
    if (!plan.intent?.trim() || !plan.northStar?.trim()) {
      return { ok: false, error: "提交前需填写战略意图与北极星" };
    }
    if (plan._count.objectives < 1) {
      return { ok: false, error: "提交前需至少一个 BSC 目标" };
    }
    await prisma.strategicPlan.update({
      where: { id: plan.id },
      data: {
        status: "SUBMITTED",
        submittedAt: now,
        submittedById: input.submitterId ?? null,
      },
    });
    // 统一提交语义：提交即冻结快照（与编制页 route.ts 同一构建器，消除 A2 状态分裂）。
    await writePlanSnapshot({
      planId: plan.id,
      orgUnitId: input.orgUnitId,
      horizonStart,
      horizonEnd,
      status: "SUBMITTED",
      submittedById: input.submitterId ?? null,
      submittedAt: now,
    });
    return { ok: true, status: "SUBMITTED" };
  }

  if (input.action === "lock") {
    if (plan.status === "LOCKED") {
      return { ok: false, error: "计划已是定稿状态" };
    }
    if (plan.status !== "SUBMITTED") {
      return { ok: false, error: "请先提交计划，再定稿锁定" };
    }
    await prisma.strategicPlan.update({
      where: { id: plan.id },
      data: { status: "LOCKED", lockedAt: now },
    });
    // 消除 A1 死路：把最新快照提升为 LOCKED；若无快照则从库补建一份 LOCKED 快照。
    const promoted = await promoteLatestSnapshotToLocked(input.orgUnitId, horizonStart, horizonEnd);
    if (!promoted) {
      await writePlanSnapshot({
        planId: plan.id,
        orgUnitId: input.orgUnitId,
        horizonStart,
        horizonEnd,
        status: "LOCKED",
        submittedById: input.submitterId ?? null,
        submittedAt: now,
      });
    }
    return { ok: true, status: "LOCKED" };
  }

  if (input.action === "reopen") {
    if (plan.status !== "LOCKED") {
      return { ok: false, error: "仅已定稿计划可重新打开" };
    }
    await prisma.strategicPlan.update({
      where: { id: plan.id },
      data: {
        status: "DRAFT",
        lockedAt: null,
      },
    });
    return { ok: true, status: "DRAFT" };
  }

  return { ok: false, error: "未知操作" };
}
