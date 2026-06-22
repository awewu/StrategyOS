import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getActiveStrategicPlan } from "@/lib/data/strategic-plan-data";
import { refreshCompassAudit, refreshPlanCompassAudit } from "@/lib/compass/sync-audit";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { mode?: "all" | "assumptions" | "signals" };
    const mode = body.mode ?? "all";
    const opts = {
      assumptions: mode === "all" || mode === "assumptions",
      signals: mode === "all" || mode === "signals",
    };

    const { plan } = await getActiveStrategicPlan();
    if (plan) {
      const result = await refreshPlanCompassAudit(plan.id, opts);
      return NextResponse.json({ ok: true, planId: plan.id, ...result });
    }

    const ns = await prisma.companyNorthStar.findFirst({ where: { active: true } });
    if (!ns) {
      return NextResponse.json({ error: "请先录入使命愿景或编制战略计划" }, { status: 400 });
    }

    const result = await refreshCompassAudit(ns.id, opts);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "sync failed";
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}
