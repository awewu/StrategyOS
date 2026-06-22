import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureCompassChildren, ensurePlanCompassChildren } from "@/lib/compass/seed";
import { getActivePeriod } from "@/lib/data/active-period";
import {
  getActiveStrategicPlan,
  DEFAULT_HORIZON_END,
  DEFAULT_HORIZON_START,
  DEFAULT_GROUP_ORG_UNIT_ID,
} from "@/lib/data/strategic-plan-data";
import {
  syncPlanAssumptionsToPremises,
  syncPlanPremisesToAssumptions,
} from "@/lib/data/plan-assumption-sync";

function northStarInputFromPlan(
  plan: NonNullable<Awaited<ReturnType<typeof getActiveStrategicPlan>>["plan"]>,
) {
  return {
    targetYear: plan.targetYear ?? 2030,
    revenueTarget: plan.revenueTarget ?? 25000,
    profitMarginTarget: plan.profitMarginTarget ?? 0.12,
  };
}

/** 为 StrategicPlan（优先）或 North Star 补生成路径里程碑 + 前提审计模板 */
export async function POST() {
  try {
    const fpa = await prisma.fpaPeriod.findFirst({ where: { period: await getActivePeriod(), scope: "company" } });
    const currentRevenue = fpa ? Number(fpa.revenueActual) : 5120;
    const currentYear = new Date().getFullYear();

    const { plan } = await getActiveStrategicPlan(
      DEFAULT_GROUP_ORG_UNIT_ID,
      DEFAULT_HORIZON_START,
      DEFAULT_HORIZON_END,
    );

    if (plan) {
      const ns = northStarInputFromPlan(plan);
      const result = await ensurePlanCompassChildren(plan.id, ns, currentYear, currentRevenue);

      const assumptionCount = await prisma.planAssumption.count({ where: { planId: plan.id } });
      let assumptionsSynced = 0;
      if (assumptionCount > 0) {
        assumptionsSynced = await syncPlanAssumptionsToPremises(plan.id);
      } else if (result.premisesCreated > 0) {
        await syncPlanPremisesToAssumptions(plan.id);
      }

      if (result.milestonesCreated === 0 && result.premisesCreated === 0 && assumptionsSynced === 0) {
        return NextResponse.json({ ok: true, planId: plan.id, message: "路径与前提已存在，无需重复生成" });
      }

      return NextResponse.json({ ok: true, planId: plan.id, assumptionsSynced, ...result });
    }

    const ns = await prisma.companyNorthStar.findFirst({ where: { active: true } });
    if (!ns) {
      return NextResponse.json({ error: "请先录入使命愿景或编制战略计划" }, { status: 400 });
    }

    const result = await ensureCompassChildren(
      ns.id,
      {
        targetYear: ns.targetYear,
        revenueTarget: Number(ns.revenueTarget),
        profitMarginTarget: Number(ns.profitMarginTarget),
      },
      currentYear,
      currentRevenue,
    );

    if (result.milestonesCreated === 0 && result.premisesCreated === 0) {
      return NextResponse.json({ ok: true, message: "路径与前提已存在，无需重复生成" });
    }

    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "seed failed";
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}
