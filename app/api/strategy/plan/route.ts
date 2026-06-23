import { NextResponse } from "next/server";
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
type OrgChartNodeInput = { parentId?: string; name?: string; role?: string; headcount?: number; headcountNew?: number; note?: string };
type ChannelPlanInput = { channelType?: string; currentState?: string; targetState?: string; q1Action?: string; q2Action?: string; q3Action?: string; q4Action?: string; revenueTarget?: string; partnerCount?: number; note?: string };
type CustomerPlanInput = { customerSegment?: string; isNew?: boolean; currentCount?: number; targetCount?: number; q1Count?: number; q2Count?: number; q3Count?: number; q4Count?: number; revenuePerCustomer?: string; acquisitionStrategy?: string; retentionStrategy?: string; note?: string };
type ProductQuarterlyInput = { productName?: string; unit?: string; q1Qty?: string; q1Revenue?: string; q2Qty?: string; q2Revenue?: string; q3Qty?: string; q3Revenue?: string; q4Qty?: string; q4Revenue?: string; annualQty?: string; annualRevenue?: string; note?: string };

const VALID_DIMENSIONS = ["FINANCIAL", "CUSTOMER", "PROCESS", "LEARNING"];

function parseAmount(raw?: string): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^0-9.\-]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
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
      submit?: boolean;
    };

    if (!orgUnitId) {
      return NextResponse.json({ error: "orgUnitId required" }, { status: 400 });
    }

    if (submit) {
      if (!intent?.trim() || !northStar?.trim()) {
        return NextResponse.json({ error: "intent 与 northStar 为提交必填" }, { status: 400 });
      }
      const hasObjective = objectives.some((o) => o.objective?.trim());
      if (!hasObjective) {
        return NextResponse.json({ error: "提交需至少一个 BSC 目标" }, { status: 400 });
      }
    }

    const planId = await prisma.$transaction(async (tx) => {
      const existing = await tx.strategicPlan.findFirst({
        where: { orgUnitId, horizonStart, horizonEnd },
        select: { id: true },
      });

      const plan = existing
        ? await tx.strategicPlan.update({
            where: { id: existing.id },
            data: {
              intent: intent ?? null,
              northStar: northStar ?? null,
              ...(submit
                ? { status: "SUBMITTED", submittedAt: new Date(), submittedById: submitterId }
                : {}),
            },
          })
        : await tx.strategicPlan.create({
            data: {
              orgUnitId,
              horizonStart,
              horizonEnd,
              intent: intent ?? null,
              northStar: northStar ?? null,
              status: submit ? "SUBMITTED" : "DRAFT",
              submittedAt: submit ? new Date() : null,
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

      // 目标 + KR
      let oSort = 0;
      for (const o of objectives) {
        if (!VALID_DIMENSIONS.includes(o.dimension)) continue;
        if (!o.objective?.trim() && !(o.keyResults ?? []).some((k) => k.keyResult?.trim())) continue;
        const created = await tx.planObjective.create({
          data: {
            planId: plan.id,
            dimension: o.dimension as "FINANCIAL" | "CUSTOMER" | "PROCESS" | "LEARNING",
            objective: o.objective?.trim() ?? "",
            sortOrder: oSort++,
          },
        });
        let kSort = 0;
        for (const k of o.keyResults ?? []) {
          if (!k.keyResult?.trim()) continue;
          await tx.planKeyResult.create({
            data: {
              objectiveId: created.id,
              keyResult: k.keyResult.trim(),
              target: k.target?.trim() || null,
              sortOrder: kSort++,
            },
          });
        }
      }

      // 举措（OKR关键举措级成果）
      let iSort = 0;
      for (const i of initiatives) {
        if (!i.title?.trim()) continue;
        await tx.planInitiative.create({
          data: {
            planId: plan.id,
            title: i.title.trim(),
            ownerName: i.ownerName?.trim() || null,
            q1Milestone: i.q1Milestone?.trim() || null,
            q2Milestone: i.q2Milestone?.trim() || null,
            q3Milestone: i.q3Milestone?.trim() || null,
            q4Milestone: i.q4Milestone?.trim() || null,
            okrKeyResult: i.okrKeyResult?.trim() || null,
            okrTarget: i.okrTarget?.trim() || null,
            okrBaseline: i.okrBaseline?.trim() || null,
            sortOrder: iSort++,
          },
        });
      }

      // SWOT
      let swSort = 0;
      for (const sw of swotItems) {
        if (!sw.content?.trim()) continue;
        await tx.planSwotItem.create({
          data: { planId: plan.id, quadrant: sw.quadrant, content: sw.content.trim(), sortOrder: swSort++ },
        });
      }

      // 组织规划
      let orgSort = 0;
      for (const node of orgChartNodes) {
        if (!node.name?.trim()) continue;
        await tx.planOrgChartNode.create({
          data: {
            planId: plan.id,
            parentId: node.parentId?.trim() || null,
            name: node.name.trim(),
            role: node.role?.trim() || null,
            headcount: node.headcount ?? null,
            headcountNew: node.headcountNew ?? null,
            note: node.note?.trim() || null,
            sortOrder: orgSort++,
          },
        });
      }

      // 渠道发展
      let chSort = 0;
      for (const ch of channelPlans) {
        if (!ch.channelType?.trim()) continue;
        await tx.planChannelPlan.create({
          data: {
            planId: plan.id,
            channelType: ch.channelType.trim(),
            currentState: ch.currentState?.trim() || null,
            targetState: ch.targetState?.trim() || null,
            q1Action: ch.q1Action?.trim() || null,
            q2Action: ch.q2Action?.trim() || null,
            q3Action: ch.q3Action?.trim() || null,
            q4Action: ch.q4Action?.trim() || null,
            revenueTarget: parseAmount(ch.revenueTarget),
            partnerCount: ch.partnerCount ?? null,
            note: ch.note?.trim() || null,
            sortOrder: chSort++,
          },
        });
      }

      // 客户发展
      let custSort = 0;
      for (const cu of customerPlans) {
        if (!cu.customerSegment?.trim()) continue;
        await tx.planCustomerPlan.create({
          data: {
            planId: plan.id,
            customerSegment: cu.customerSegment.trim(),
            isNew: !!cu.isNew,
            currentCount: cu.currentCount ?? null,
            targetCount: cu.targetCount ?? null,
            q1Count: cu.q1Count ?? null,
            q2Count: cu.q2Count ?? null,
            q3Count: cu.q3Count ?? null,
            q4Count: cu.q4Count ?? null,
            revenuePerCustomer: parseAmount(cu.revenuePerCustomer),
            acquisitionStrategy: cu.acquisitionStrategy?.trim() || null,
            retentionStrategy: cu.retentionStrategy?.trim() || null,
            note: cu.note?.trim() || null,
            sortOrder: custSort++,
          },
        });
      }

      // 产品季度推进
      let pqSort = 0;
      for (const pq of productQuarterly) {
        if (!pq.productName?.trim()) continue;
        await tx.planProductQuarterly.create({
          data: {
            planId: plan.id,
            productName: pq.productName.trim(),
            unit: pq.unit?.trim() || null,
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
            note: pq.note?.trim() || null,
            sortOrder: pqSort++,
          },
        });
      }

      // 资源
      for (const r of resources) {
        const amount = parseAmount(r.amount);
        if (amount == null && !r.justification?.trim()) continue;
        await tx.resourceRequest.create({
          data: {
            planId: plan.id,
            resourceType: r.resourceType,
            amount,
            justification: r.justification?.trim() || null,
          },
        });
      }

      // 假设
      for (const a of assumptions) {
        if (!a.assumption?.trim()) continue;
        await tx.planAssumption.create({
          data: {
            planId: plan.id,
            assumption: a.assumption.trim(),
            critical: !!a.critical,
          },
        });
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
      },
    });

    return NextResponse.json(plan || null);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "unknown error";
    console.error("Strategy plan fetch error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
