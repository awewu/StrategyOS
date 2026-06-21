import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureCompassChildren } from "@/lib/compass/seed";

async function currentRevenueWan(): Promise<number> {
  const fpa = await prisma.fpaPeriod.findFirst({ where: { period: "2026-FY", scope: "company" } });
  return fpa ? Number(fpa.revenueActual) : 5120;
}

export async function GET() {
  const ns = await prisma.companyNorthStar.findFirst({
    where: { active: true },
    include: { milestones: { orderBy: { year: "asc" } }, premiseAudit: { orderBy: { code: "asc" } } },
  });
  return NextResponse.json(ns ?? null);
}

function isPersistedNorthStarId(id: unknown): id is string {
  return typeof id === "string" && id.length > 0 && !id.startsWith("demo");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // 编辑既有版本：原地更新，保留已绑定的里程碑与前提审计
    if (isPersistedNorthStarId(body.id)) {
      const ns = await prisma.companyNorthStar.update({
        where: { id: body.id },
        data: {
          mission: body.mission,
          vision: body.vision,
          targetYear: body.targetYear,
          revenueTarget: body.revenueTarget,
          profitMarginTarget: body.profitMarginTarget,
          marketPositionDesc: body.marketPositionDesc ?? null,
          geographyDesc: body.geographyDesc ?? null,
          brandDesc: body.brandDesc ?? null,
        },
      });
      return NextResponse.json({ id: ns.id });
    }
    // 新建版本：旧版本置为非激活，保留历史
    await prisma.companyNorthStar.updateMany({ where: { active: true }, data: { active: false } });
    const ns = await prisma.companyNorthStar.create({
      data: {
        mission: body.mission,
        vision: body.vision,
        targetYear: body.targetYear,
        revenueTarget: body.revenueTarget,
        profitMarginTarget: body.profitMarginTarget,
        marketPositionDesc: body.marketPositionDesc ?? null,
        geographyDesc: body.geographyDesc ?? null,
        brandDesc: body.brandDesc ?? null,
      },
    });
    const currentYear = new Date().getFullYear();
    const currentRevenue = await currentRevenueWan();
    await ensureCompassChildren(
      ns.id,
      {
        targetYear: body.targetYear,
        revenueTarget: body.revenueTarget,
        profitMarginTarget: body.profitMarginTarget,
      },
      currentYear,
      currentRevenue,
    );
    return NextResponse.json({ id: ns.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "save failed";
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}
