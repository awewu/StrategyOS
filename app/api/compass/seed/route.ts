import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureCompassChildren } from "@/lib/compass/seed";

/** 为已有 North Star 补生成路径里程碑 + 前提审计模板 */
export async function POST() {
  try {
    const ns = await prisma.companyNorthStar.findFirst({
      where: { active: true },
    });
    if (!ns) {
      return NextResponse.json({ error: "请先录入使命愿景" }, { status: 400 });
    }

    const fpa = await prisma.fpaPeriod.findFirst({ where: { period: "2026-FY", scope: "company" } });
    const currentRevenue = fpa ? Number(fpa.revenueActual) : 5120;
    const currentYear = new Date().getFullYear();

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
