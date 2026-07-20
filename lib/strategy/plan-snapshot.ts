/**
 * 统一的提交快照构建器 —— 单一真相。
 *  - buildSnapshotJson: 纯 shape 定义（route.ts 与 lifecycle 共用，消除 A2 快照格式分裂）。
 *  - readPlanSnapshotInput: 从 DB 读取计划全量关系 → 快照输入（供 lifecycle.submit 建快照）。
 *  - writePlanSnapshot: 版本自增 + 插入快照。
 *  - promoteLatestSnapshotToLocked: lock 时把最新快照升级为 LOCKED（消除 A1 死路）。
 */
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";

type Nullable = string | null | undefined;

export interface SnapshotInput {
  orgUnitId: string;
  horizonStart: number;
  horizonEnd: number;
  intent?: Nullable;
  northStar?: Nullable;
  objectives?: unknown[];
  initiatives?: unknown[];
  resources?: unknown[];
  assumptions?: unknown[];
  swotItems?: unknown[];
  orgChartNodes?: unknown[];
  channelPlans?: unknown[];
  customerPlans?: unknown[];
  productQuarterly?: unknown[];
  marketInsights?: unknown[];
  actionItems?: unknown[];
  budgetItems?: unknown[];
  roadmapItems?: unknown[];
}

function txt(v: Nullable): string {
  return typeof v === "string" ? v.trim() : v == null ? "" : String(v);
}

/** 快照 JSON 的唯一 shape 定义（route.ts / lifecycle 共用）。 */
export function buildSnapshotJson(input: SnapshotInput) {
  return {
    orgUnitId: input.orgUnitId,
    horizonStart: input.horizonStart,
    horizonEnd: input.horizonEnd,
    intent: txt(input.intent),
    northStar: txt(input.northStar),
    objectives: input.objectives ?? [],
    initiatives: input.initiatives ?? [],
    resources: input.resources ?? [],
    assumptions: input.assumptions ?? [],
    swotItems: input.swotItems ?? [],
    orgChartNodes: input.orgChartNodes ?? [],
    channelPlans: input.channelPlans ?? [],
    customerPlans: input.customerPlans ?? [],
    productQuarterly: input.productQuarterly ?? [],
    marketInsights: input.marketInsights ?? [],
    actionItems: input.actionItems ?? [],
    budgetItems: input.budgetItems ?? [],
    roadmapItems: input.roadmapItems ?? [],
  };
}

const dec = (v: unknown): string => (v == null ? "" : String(v));

/** 从 DB 读取计划全量关系并映射为快照输入（字段名与 route.ts 保存循环对齐）。 */
export async function readPlanSnapshotInput(planId: string): Promise<SnapshotInput | null> {
  const plan = await prisma.strategicPlan.findUnique({
    where: { id: planId },
    include: {
      objectives: { include: { keyResults: { orderBy: { sortOrder: "asc" } } }, orderBy: { sortOrder: "asc" } },
      initiatives: { orderBy: { sortOrder: "asc" } },
      resourceReqs: true,
      assumptions: true,
      swotItems: { orderBy: { sortOrder: "asc" } },
      orgChartNodes: { orderBy: { sortOrder: "asc" } },
      channelPlans: { orderBy: { sortOrder: "asc" } },
      customerPlans: { orderBy: { sortOrder: "asc" } },
      productQuarterly: { orderBy: { sortOrder: "asc" } },
      marketInsights: { orderBy: { sortOrder: "asc" } },
      actionItems: { orderBy: { sortOrder: "asc" } },
      budgetItems: { orderBy: { sortOrder: "asc" } },
      roadmapItems: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!plan) return null;

  return {
    orgUnitId: plan.orgUnitId,
    horizonStart: plan.horizonStart,
    horizonEnd: plan.horizonEnd,
    intent: plan.intent,
    northStar: plan.northStar,
    objectives: plan.objectives.map((o) => ({
      dimension: o.dimension,
      objective: o.objective,
      mustNotFail: o.mustNotFail,
      keyResults: o.keyResults.map((k) => ({ keyResult: k.keyResult, target: k.target, kpiCode: k.kpiCode ?? null })),
    })),
    initiatives: plan.initiatives.map((i) => ({
      title: i.title,
      ownerName: i.ownerName,
      q1Milestone: i.q1Milestone,
      q2Milestone: i.q2Milestone,
      q3Milestone: i.q3Milestone,
      q4Milestone: i.q4Milestone,
      okrKeyResult: i.okrKeyResult,
      okrTarget: i.okrTarget,
      okrBaseline: i.okrBaseline,
    })),
    resources: plan.resourceReqs.map((r) => ({
      resourceType: r.resourceType,
      amount: dec(r.amount),
      justification: r.justification,
    })),
    assumptions: plan.assumptions.map((a) => ({ assumption: a.assumption, critical: a.critical })),
    swotItems: plan.swotItems.map((s) => ({
      quadrant: s.quadrant,
      content: s.content,
      weight: s.weight,
      intensity: s.intensity,
      dimension: s.dimension,
    })),
    orgChartNodes: plan.orgChartNodes.map((n) => ({
      parentId: n.parentId,
      name: n.name,
      role: n.role,
      headcount: n.headcount,
      headcountNew: n.headcountNew,
      note: n.note,
    })),
    channelPlans: plan.channelPlans.map((c) => ({
      channelType: c.channelType,
      currentState: c.currentState,
      targetState: c.targetState,
      q1Action: c.q1Action,
      q2Action: c.q2Action,
      q3Action: c.q3Action,
      q4Action: c.q4Action,
      revenueTarget: dec(c.revenueTarget),
      partnerCount: c.partnerCount,
      note: c.note,
    })),
    customerPlans: plan.customerPlans.map((c) => ({
      customerSegment: c.customerSegment,
      isNew: c.isNew,
      currentCount: c.currentCount,
      targetCount: c.targetCount,
      q1Count: c.q1Count,
      q2Count: c.q2Count,
      q3Count: c.q3Count,
      q4Count: c.q4Count,
      revenuePerCustomer: dec(c.revenuePerCustomer),
      acquisitionStrategy: c.acquisitionStrategy,
      retentionStrategy: c.retentionStrategy,
      note: c.note,
    })),
    productQuarterly: plan.productQuarterly.map((p) => ({
      productName: p.productName,
      unit: p.unit,
      q1Qty: dec(p.q1Qty),
      q1Revenue: dec(p.q1Revenue),
      q2Qty: dec(p.q2Qty),
      q2Revenue: dec(p.q2Revenue),
      q3Qty: dec(p.q3Qty),
      q3Revenue: dec(p.q3Revenue),
      q4Qty: dec(p.q4Qty),
      q4Revenue: dec(p.q4Revenue),
      annualQty: dec(p.annualQty),
      annualRevenue: dec(p.annualRevenue),
      note: p.note,
    })),
    marketInsights: plan.marketInsights.map((m) => ({
      category: m.category,
      title: m.title,
      content: m.content,
      dataPoint: m.dataPoint,
      source: m.source,
    })),
    actionItems: plan.actionItems.map((a) => ({
      initiativeTitle: a.initiativeTitle,
      year: a.year,
      quarter: a.quarter,
      action: a.action,
      ownerName: a.ownerName,
      acceptanceCriteria: a.acceptanceCriteria,
      checkDate: a.checkDate,
      status: a.status,
    })),
    budgetItems: plan.budgetItems.map((b) => ({
      category: b.category,
      initiativeTitle: b.initiativeTitle,
      department: b.department,
      description: b.description,
      year1Amount: b.year1Amount,
      year2Amount: b.year2Amount,
      year3Amount: b.year3Amount,
      totalAmount: b.totalAmount,
      roiEstimate: b.roiEstimate,
      justification: b.justification,
    })),
    roadmapItems: plan.roadmapItems.map((r) => ({
      track: r.track,
      title: r.title,
      startYear: r.startYear,
      startQ: r.startQ,
      endYear: r.endYear,
      endQ: r.endQ,
      milestone: r.milestone,
      color: r.color,
    })),
  };
}

/** 版本自增 + 插入快照。返回写入的版本号。 */
export async function writePlanSnapshot(params: {
  planId: string;
  orgUnitId: string;
  horizonStart: number;
  horizonEnd: number;
  status: "SUBMITTED" | "LOCKED";
  submittedById?: string | null;
  submittedAt?: Date;
}): Promise<number> {
  const input = await readPlanSnapshotInput(params.planId);
  if (!input) throw new Error("plan not found for snapshot");
  const snapshot = buildSnapshotJson(input);

  const nextVersionRows = await prisma.$queryRaw<Array<{ version: number }>>`
    SELECT COALESCE(MAX("version"), 0) + 1 AS "version"
    FROM "plan_submission_snapshots"
    WHERE "org_unit_id" = ${params.orgUnitId}
      AND "horizon_start" = ${params.horizonStart}
      AND "horizon_end" = ${params.horizonEnd}
  `;
  const version = Number(nextVersionRows[0]?.version ?? 1);
  const submittedAt = params.submittedAt ?? new Date();

  await prisma.$executeRaw`
    INSERT INTO "plan_submission_snapshots" (
      "id", "plan_id", "org_unit_id", "horizon_start", "horizon_end",
      "version", "status", "submitted_at", "submitted_by_id", "snapshot_json"
    )
    VALUES (
      ${randomUUID()}, ${params.planId}, ${params.orgUnitId}, ${params.horizonStart}, ${params.horizonEnd},
      ${version}, ${params.status}, ${submittedAt}, ${params.submittedById ?? null},
      CAST(${JSON.stringify(snapshot)} AS JSONB)
    )
  `;
  return version;
}

/**
 * 把该 org/horizon 下最新一版快照提升为 LOCKED。
 * 返回是否有快照被提升（false 表示尚无快照 —— 调用方应先建快照）。
 */
export async function promoteLatestSnapshotToLocked(
  orgUnitId: string,
  horizonStart: number,
  horizonEnd: number,
): Promise<boolean> {
  const affected = await prisma.$executeRaw`
    UPDATE "plan_submission_snapshots"
    SET "status" = 'LOCKED'
    WHERE "id" = (
      SELECT "id" FROM "plan_submission_snapshots"
      WHERE "org_unit_id" = ${orgUnitId}
        AND "horizon_start" = ${horizonStart}
        AND "horizon_end" = ${horizonEnd}
      ORDER BY "version" DESC
      LIMIT 1
    )
  `;
  return Number(affected) > 0;
}
