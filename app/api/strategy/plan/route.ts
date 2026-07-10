import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { syncPlanAssumptionsToPremises } from "@/lib/data/plan-assumption-sync";

const HORIZON_START = 2026;
const HORIZON_END = 2028;

type KeyResultInput = { keyResult?: string; target?: string };
type ObjectiveInput = { dimension: string; objective?: string; keyResults?: KeyResultInput[] };
type InitiativeInput = {
  title?: string;
  ownerName?: string;
  q1Milestone?: string;
  q2Milestone?: string;
  q3Milestone?: string;
  q4Milestone?: string;
  okrKeyResult?: string;
  okrTarget?: string;
  okrBaseline?: string;
};
type ResourceInput = { resourceType: string; amount?: string; justification?: string };
type AssumptionInput = { assumption?: string; critical?: boolean };
type SwotItemInput = { quadrant: "strength" | "weakness" | "opportunity" | "threat"; content?: string };
type OrgChartNodeInput = { parentId?: string; name?: string; role?: string; headcount?: number | string; headcountNew?: number | string; note?: string };
type NumericInput = number | string;
type ChannelPlanInput = { channelType?: string; currentState?: string; targetState?: string; q1Action?: string; q2Action?: string; q3Action?: string; q4Action?: string; revenueTarget?: NumericInput; partnerCount?: number | string; note?: string };
type CustomerPlanInput = { customerSegment?: string; isNew?: boolean; currentCount?: number | string; targetCount?: number | string; q1Count?: number | string; q2Count?: number | string; q3Count?: number | string; q4Count?: number | string; revenuePerCustomer?: NumericInput; acquisitionStrategy?: string; retentionStrategy?: string; note?: string };
type ProductQuarterlyInput = { productName?: string; unit?: string; q1Qty?: NumericInput; q1Revenue?: NumericInput; q2Qty?: NumericInput; q2Revenue?: NumericInput; q3Qty?: NumericInput; q3Revenue?: NumericInput; q4Qty?: NumericInput; q4Revenue?: NumericInput; annualQty?: NumericInput; annualRevenue?: NumericInput; note?: string };
type MarketInsightInput = { category?: string; title?: string; content?: string; dataPoint?: string; source?: string };
type ActionItemInput = { initiativeTitle?: string; year?: number | string; quarter?: number | string; action?: string; ownerName?: string; acceptanceCriteria?: string; checkDate?: string; status?: string };
type BudgetItemInput = { category?: string; initiativeTitle?: string; department?: string; description?: string; year1Amount?: string; year2Amount?: string; year3Amount?: string; totalAmount?: string; roiEstimate?: string; justification?: string };
type RoadmapItemInput = { track?: string; title?: string; startYear?: number | string; startQ?: number | string; endYear?: number | string; endQ?: number | string; milestone?: string; color?: string };

const VALID_DIMENSIONS = ["FINANCIAL", "CUSTOMER", "PROCESS", "LEARNING"];

function parseAmount(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  if (typeof raw !== "string") return null;
  const cleaned = raw.replace(/[^0-9.\-]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function parseInteger(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  if (typeof raw === "number") return Number.isFinite(raw) ? Math.trunc(raw) : null;
  if (typeof raw !== "string") return null;
  const match = raw.match(/-?\d+/);
  if (!match) return null;
  const n = Number(match[0]);
  return Number.isFinite(n) ? n : null;
}

function text(raw: unknown): string {
  if (raw === null || raw === undefined) return "";
  if (typeof raw === "string") return raw.trim();
  if (typeof raw === "number" || typeof raw === "boolean") return String(raw);
  return "";
}

function nullableText(raw: unknown): string | null {
  return text(raw) || null;
}

function anyText(...values: unknown[]): boolean {
  return values.some((value) => text(value));
}

function hasMeaningfulPlanPayload(input: {
  intent?: string;
  northStar?: string;
  objectives?: ObjectiveInput[];
  initiatives?: InitiativeInput[];
  resources?: ResourceInput[];
  assumptions?: AssumptionInput[];
  swotItems?: SwotItemInput[];
  orgChartNodes?: OrgChartNodeInput[];
  channelPlans?: ChannelPlanInput[];
  customerPlans?: CustomerPlanInput[];
  productQuarterly?: ProductQuarterlyInput[];
  marketInsights?: MarketInsightInput[];
  actionItems?: ActionItemInput[];
  budgetItems?: BudgetItemInput[];
  roadmapItems?: RoadmapItemInput[];
}): boolean {
  if (anyText(input.intent, input.northStar)) return true;
  if ((input.objectives ?? []).some((o) => anyText(o.objective) || (o.keyResults ?? []).some((k) => anyText(k.keyResult, k.target)))) return true;
  if ((input.initiatives ?? []).some((i) => anyText(i.title, i.ownerName, i.q1Milestone, i.q2Milestone, i.q3Milestone, i.q4Milestone, i.okrKeyResult, i.okrTarget, i.okrBaseline))) return true;
  if ((input.resources ?? []).some((r) => anyText(r.amount, r.justification))) return true;
  if ((input.assumptions ?? []).some((a) => anyText(a.assumption))) return true;
  if ((input.swotItems ?? []).some((sw) => anyText(sw.content))) return true;
  if ((input.orgChartNodes ?? []).some((node) => anyText(node.name, node.role, node.headcount, node.headcountNew, node.note))) return true;
  if ((input.channelPlans ?? []).some((ch) => anyText(ch.channelType, ch.currentState, ch.targetState, ch.q1Action, ch.q2Action, ch.q3Action, ch.q4Action, ch.revenueTarget, ch.partnerCount, ch.note))) return true;
  if ((input.customerPlans ?? []).some((cu) => anyText(cu.customerSegment, cu.currentCount, cu.targetCount, cu.q1Count, cu.q2Count, cu.q3Count, cu.q4Count, cu.revenuePerCustomer, cu.acquisitionStrategy, cu.retentionStrategy, cu.note))) return true;
  if ((input.productQuarterly ?? []).some((pq) => anyText(pq.productName, pq.unit, pq.q1Qty, pq.q1Revenue, pq.q2Qty, pq.q2Revenue, pq.q3Qty, pq.q3Revenue, pq.q4Qty, pq.q4Revenue, pq.annualQty, pq.annualRevenue, pq.note))) return true;
  if ((input.marketInsights ?? []).some((mi) => anyText(mi.title, mi.content, mi.dataPoint, mi.source))) return true;
  if ((input.actionItems ?? []).some((ai) => anyText(ai.initiativeTitle, ai.action, ai.ownerName, ai.acceptanceCriteria, ai.checkDate))) return true;
  if ((input.budgetItems ?? []).some((bi) => anyText(bi.initiativeTitle, bi.department, bi.description, bi.year1Amount, bi.year2Amount, bi.year3Amount, bi.totalAmount, bi.roiEstimate, bi.justification))) return true;
  if ((input.roadmapItems ?? []).some((rm) => anyText(rm.title, rm.milestone))) return true;
  return false;
}

function buildSubmissionSnapshot(input: {
  orgUnitId: string;
  horizonStart: number;
  horizonEnd: number;
  intent?: string;
  northStar?: string;
  objectives?: ObjectiveInput[];
  initiatives?: InitiativeInput[];
  resources?: ResourceInput[];
  assumptions?: AssumptionInput[];
  swotItems?: SwotItemInput[];
  orgChartNodes?: OrgChartNodeInput[];
  channelPlans?: ChannelPlanInput[];
  customerPlans?: CustomerPlanInput[];
  productQuarterly?: ProductQuarterlyInput[];
  marketInsights?: MarketInsightInput[];
  actionItems?: ActionItemInput[];
  budgetItems?: BudgetItemInput[];
  roadmapItems?: RoadmapItemInput[];
}) {
  return {
    orgUnitId: input.orgUnitId,
    horizonStart: input.horizonStart,
    horizonEnd: input.horizonEnd,
    intent: text(input.intent),
    northStar: text(input.northStar),
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

export async function POST(req: Request) {
  try {
    const session = await getSession();
    // 仅当 session 用户在库中真实存在时才记录提交人（避免 demo 会话破坏外键）
    let submitterId: string | null = null;
    if (session?.userId) {
      const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { id: true } });
      submitterId = user?.id ?? null;
    }
    const body = await req.json();
    const {
      orgUnitId,
      horizonStart = HORIZON_START,
      horizonEnd = HORIZON_END,
      intent,
      northStar,
      objectives = [],
      initiatives = [],
      resources = [],
      assumptions = [],
      swotItems = [],
      orgChartNodes = [],
      channelPlans = [],
      customerPlans = [],
      productQuarterly = [],
      marketInsights = [],
      actionItems = [],
      budgetItems = [],
      roadmapItems = [],
      submit,
    } = body as {
      orgUnitId?: string;
      horizonStart?: number;
      horizonEnd?: number;
      intent?: string;
      northStar?: string;
      objectives?: ObjectiveInput[];
      initiatives?: InitiativeInput[];
      resources?: ResourceInput[];
      assumptions?: AssumptionInput[];
      swotItems?: SwotItemInput[];
      orgChartNodes?: OrgChartNodeInput[];
      channelPlans?: ChannelPlanInput[];
      customerPlans?: CustomerPlanInput[];
      productQuarterly?: ProductQuarterlyInput[];
      marketInsights?: MarketInsightInput[];
      actionItems?: ActionItemInput[];
      budgetItems?: BudgetItemInput[];
      roadmapItems?: RoadmapItemInput[];
      submit?: boolean;
    };

    if (!orgUnitId) {
      return NextResponse.json({ error: "orgUnitId required" }, { status: 400 });
    }

    if (submit) {
      if (!text(intent) || !text(northStar)) {
        return NextResponse.json({ error: "intent 与 northStar 为提交必填" }, { status: 400 });
      }
      const hasObjective = objectives.some((o) => text(o.objective));
      if (!hasObjective) {
        return NextResponse.json({ error: "提交需至少一个 BSC 目标" }, { status: 400 });
      }
    }

    const hasMeaningfulPayload = hasMeaningfulPlanPayload({
      intent,
      northStar,
      objectives,
      initiatives,
      resources,
      assumptions,
      swotItems,
      orgChartNodes,
      channelPlans,
      customerPlans,
      productQuarterly,
      marketInsights,
      actionItems,
      budgetItems,
      roadmapItems,
    });

    const submittedAt = submit ? new Date() : null;
    const planId = await prisma.$transaction(async (tx) => {
      const existing = await tx.strategicPlan.findFirst({
        where: { orgUnitId, horizonStart, horizonEnd },
        select: { id: true },
      });

      if (!submit && !hasMeaningfulPayload) {
        if (existing) return existing.id;
        const shell = await tx.strategicPlan.create({
          data: {
            orgUnitId,
            horizonStart,
            horizonEnd,
            status: "DRAFT",
          },
        });
        return shell.id;
      }

      const plan = existing
        ? await tx.strategicPlan.update({
            where: { id: existing.id },
            data: {
              intent: nullableText(intent),
              northStar: nullableText(northStar),
              ...(submit
                ? { status: "SUBMITTED", submittedAt, submittedById: submitterId }
                : { status: "DRAFT", submittedAt: null, submittedById: null }),
            },
          })
        : await tx.strategicPlan.create({
            data: {
              orgUnitId,
              horizonStart,
              horizonEnd,
              intent: nullableText(intent),
              northStar: nullableText(northStar),
              status: submit ? "SUBMITTED" : "DRAFT",
              submittedAt,
              submittedById: submit ? submitterId : null,
            },
          });

      // 全量替换子集合（草稿语义：以本次提交为准）
      await tx.planObjective.deleteMany({ where: { planId: plan.id } });
      await tx.planInitiative.deleteMany({ where: { planId: plan.id } });
      await tx.resourceRequest.deleteMany({ where: { planId: plan.id } });
      await tx.planAssumption.deleteMany({ where: { planId: plan.id } });
      await tx.planSwotItem.deleteMany({ where: { planId: plan.id } });
      await tx.planOrgChartNode.deleteMany({ where: { planId: plan.id } });
      await tx.planChannelPlan.deleteMany({ where: { planId: plan.id } });
      await tx.planCustomerPlan.deleteMany({ where: { planId: plan.id } });
      await tx.planProductQuarterly.deleteMany({ where: { planId: plan.id } });
      await tx.planMarketInsight.deleteMany({ where: { planId: plan.id } });
      await tx.planActionItem.deleteMany({ where: { planId: plan.id } });
      await tx.planBudgetItem.deleteMany({ where: { planId: plan.id } });
      await tx.planRoadmapItem.deleteMany({ where: { planId: plan.id } });

      // 目标 + KR
      let oSort = 0;
      for (const o of objectives) {
        if (!VALID_DIMENSIONS.includes(o.dimension)) continue;
        if (!text(o.objective) && !(o.keyResults ?? []).some((k) => text(k.keyResult))) continue;
        const created = await tx.planObjective.create({
          data: {
            planId: plan.id,
            dimension: o.dimension as "FINANCIAL" | "CUSTOMER" | "PROCESS" | "LEARNING",
            objective: text(o.objective),
            sortOrder: oSort++,
          },
        });
        let kSort = 0;
        for (const k of o.keyResults ?? []) {
          if (!text(k.keyResult)) continue;
          await tx.planKeyResult.create({
            data: {
              objectiveId: created.id,
              keyResult: text(k.keyResult),
              target: nullableText(k.target),
              sortOrder: kSort++,
            },
          });
        }
      }

      // 举措（OKR关键举措级成果）
      let iSort = 0;
      for (const i of initiatives) {
        if (!text(i.title)) continue;
        await tx.planInitiative.create({
          data: {
            planId: plan.id,
            title: text(i.title),
            ownerName: nullableText(i.ownerName),
            q1Milestone: nullableText(i.q1Milestone),
            q2Milestone: nullableText(i.q2Milestone),
            q3Milestone: nullableText(i.q3Milestone),
            q4Milestone: nullableText(i.q4Milestone),
            okrKeyResult: nullableText(i.okrKeyResult),
            okrTarget: nullableText(i.okrTarget),
            okrBaseline: nullableText(i.okrBaseline),
            sortOrder: iSort++,
          },
        });
      }

      // SWOT
      let swSort = 0;
      for (const sw of swotItems) {
        if (!text(sw.content)) continue;
        await tx.planSwotItem.create({
          data: { planId: plan.id, quadrant: sw.quadrant, content: text(sw.content), sortOrder: swSort++ },
        });
      }

      // 组织规划
      let orgSort = 0;
      for (const node of orgChartNodes) {
        if (!text(node.name)) continue;
        await tx.planOrgChartNode.create({
          data: {
            planId: plan.id,
            parentId: nullableText(node.parentId),
            name: text(node.name),
            role: nullableText(node.role),
            headcount: parseInteger(node.headcount),
            headcountNew: parseInteger(node.headcountNew),
            note: nullableText(node.note),
            sortOrder: orgSort++,
          },
        });
      }

      // 渠道发展
      let chSort = 0;
      for (const ch of channelPlans) {
        if (!text(ch.channelType)) continue;
        await tx.planChannelPlan.create({
          data: {
            planId: plan.id,
            channelType: text(ch.channelType),
            currentState: nullableText(ch.currentState),
            targetState: nullableText(ch.targetState),
            q1Action: nullableText(ch.q1Action),
            q2Action: nullableText(ch.q2Action),
            q3Action: nullableText(ch.q3Action),
            q4Action: nullableText(ch.q4Action),
            revenueTarget: parseAmount(ch.revenueTarget),
            partnerCount: parseInteger(ch.partnerCount),
            note: nullableText(ch.note),
            sortOrder: chSort++,
          },
        });
      }

      // 客户发展
      let custSort = 0;
      for (const cu of customerPlans) {
        if (!text(cu.customerSegment)) continue;
        await tx.planCustomerPlan.create({
          data: {
            planId: plan.id,
            customerSegment: text(cu.customerSegment),
            isNew: !!cu.isNew,
            currentCount: parseInteger(cu.currentCount),
            targetCount: parseInteger(cu.targetCount),
            q1Count: parseInteger(cu.q1Count),
            q2Count: parseInteger(cu.q2Count),
            q3Count: parseInteger(cu.q3Count),
            q4Count: parseInteger(cu.q4Count),
            revenuePerCustomer: parseAmount(cu.revenuePerCustomer),
            acquisitionStrategy: nullableText(cu.acquisitionStrategy),
            retentionStrategy: nullableText(cu.retentionStrategy),
            note: nullableText(cu.note),
            sortOrder: custSort++,
          },
        });
      }

      // 产品季度推进
      let pqSort = 0;
      for (const pq of productQuarterly) {
        if (!text(pq.productName)) continue;
        await tx.planProductQuarterly.create({
          data: {
            planId: plan.id,
            productName: text(pq.productName),
            unit: nullableText(pq.unit),
            q1Qty: parseAmount(pq.q1Qty),
            q1Revenue: parseAmount(pq.q1Revenue),
            q2Qty: parseAmount(pq.q2Qty),
            q2Revenue: parseAmount(pq.q2Revenue),
            q3Qty: parseAmount(pq.q3Qty),
            q3Revenue: parseAmount(pq.q3Revenue),
            q4Qty: parseAmount(pq.q4Qty),
            q4Revenue: parseAmount(pq.q4Revenue),
            annualQty: parseAmount(pq.annualQty),
            annualRevenue: parseAmount(pq.annualRevenue),
            note: nullableText(pq.note),
            sortOrder: pqSort++,
          },
        });
      }

      // 市场洞察
      let miSort = 0;
      for (const mi of marketInsights) {
        if (!text(mi.title) && !text(mi.content)) continue;
        await tx.planMarketInsight.create({
          data: {
            planId: plan.id,
            category: text(mi.category) || "TREND",
            title: text(mi.title),
            content: text(mi.content),
            dataPoint: nullableText(mi.dataPoint),
            source: nullableText(mi.source),
            sortOrder: miSort++,
          },
        });
      }

      // 年度作战计划
      let aiSort = 0;
      for (const ai of actionItems) {
        if (!text(ai.action)) continue;
        await tx.planActionItem.create({
          data: {
            planId: plan.id,
            initiativeTitle: nullableText(ai.initiativeTitle),
            year: parseInteger(ai.year) ?? 2026,
            quarter: parseInteger(ai.quarter) ?? 1,
            action: text(ai.action),
            ownerName: nullableText(ai.ownerName),
            acceptanceCriteria: nullableText(ai.acceptanceCriteria),
            checkDate: nullableText(ai.checkDate),
            status: text(ai.status) || "PLAN",
            sortOrder: aiSort++,
          },
        });
      }

      // 资源预算
      let biSort = 0;
      for (const bi of budgetItems) {
        if (!text(bi.description)) continue;
        await tx.planBudgetItem.create({
          data: {
            planId: plan.id,
            category: text(bi.category) || "OPEX",
            initiativeTitle: nullableText(bi.initiativeTitle),
            department: nullableText(bi.department),
            description: text(bi.description),
            year1Amount: nullableText(bi.year1Amount),
            year2Amount: nullableText(bi.year2Amount),
            year3Amount: nullableText(bi.year3Amount),
            totalAmount: nullableText(bi.totalAmount),
            roiEstimate: nullableText(bi.roiEstimate),
            justification: nullableText(bi.justification),
            sortOrder: biSort++,
          },
        });
      }

      // 路线图
      let rmSort = 0;
      for (const rm of roadmapItems) {
        if (!text(rm.title)) continue;
        await tx.planRoadmapItem.create({
          data: {
            planId: plan.id,
            track: text(rm.track) || "举措",
            title: text(rm.title),
            startYear: parseInteger(rm.startYear) ?? 2026,
            startQ: parseInteger(rm.startQ) ?? 1,
            endYear: parseInteger(rm.endYear) ?? 2026,
            endQ: parseInteger(rm.endQ) ?? 4,
            milestone: nullableText(rm.milestone),
            color: nullableText(rm.color),
            sortOrder: rmSort++,
          },
        });
      }

      // 资源
      for (const r of resources) {
        const amount = parseAmount(r.amount);
        if (amount == null && !text(r.justification)) continue;
        await tx.resourceRequest.create({
          data: {
            planId: plan.id,
            resourceType: r.resourceType,
            amount,
            justification: nullableText(r.justification),
          },
        });
      }

      // 假设
      for (const a of assumptions) {
        if (!text(a.assumption)) continue;
        await tx.planAssumption.create({
          data: {
            planId: plan.id,
            assumption: text(a.assumption),
            critical: !!a.critical,
          },
        });
      }

      if (submit && submittedAt) {
        const nextVersionRows = await tx.$queryRaw<Array<{ version: number }>>`
          SELECT COALESCE(MAX("version"), 0) + 1 AS "version"
          FROM "plan_submission_snapshots"
          WHERE "org_unit_id" = ${orgUnitId}
            AND "horizon_start" = ${horizonStart}
            AND "horizon_end" = ${horizonEnd}
        `;
        const version = Number(nextVersionRows[0]?.version ?? 1);
        const snapshot = buildSubmissionSnapshot({
          orgUnitId,
          horizonStart,
          horizonEnd,
          intent,
          northStar,
          objectives,
          initiatives,
          resources,
          assumptions,
          swotItems,
          orgChartNodes,
          channelPlans,
          customerPlans,
          productQuarterly,
          marketInsights,
          actionItems,
          budgetItems,
          roadmapItems,
        });
        await tx.$executeRaw`
          INSERT INTO "plan_submission_snapshots" (
            "id",
            "plan_id",
            "org_unit_id",
            "horizon_start",
            "horizon_end",
            "version",
            "status",
            "submitted_at",
            "submitted_by_id",
            "snapshot_json"
          )
          VALUES (
            ${randomUUID()},
            ${plan.id},
            ${orgUnitId},
            ${horizonStart},
            ${horizonEnd},
            ${version},
            'SUBMITTED',
            ${submittedAt},
            ${submitterId},
            CAST(${JSON.stringify(snapshot)} AS JSONB)
          )
        `;
      }

      return plan.id;
    });

    await syncPlanAssumptionsToPremises(planId).catch(() => undefined);

    return NextResponse.json({ success: true, planId });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "unknown error";
    console.error("Strategy plan save error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orgUnitId = searchParams.get("orgUnitId");
    const horizonStart = Number(searchParams.get("horizonStart") ?? HORIZON_START);
    const horizonEnd = Number(searchParams.get("horizonEnd") ?? HORIZON_END);

    if (!orgUnitId) {
      return NextResponse.json({ error: "orgUnitId required" }, { status: 400 });
    }

    const plan = await prisma.strategicPlan.findFirst({
      where: { orgUnitId, horizonStart, horizonEnd },
      include: {
        objectives: { include: { keyResults: { orderBy: { sortOrder: "asc" } } }, orderBy: { sortOrder: "asc" } },
        initiatives: { orderBy: { sortOrder: "asc" } },
        resourceReqs: true,
        assumptions: true,
        attachments: { orderBy: { uploadedAt: "asc" } },
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

    return NextResponse.json(plan || null);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "unknown error";
    console.error("Strategy plan fetch error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
