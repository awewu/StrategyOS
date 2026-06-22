import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  DEFAULT_GROUP_ORG_UNIT_ID,
  DEFAULT_HORIZON_END,
  DEFAULT_HORIZON_START,
  getActiveStrategicPlan,
} from "@/lib/data/strategic-plan-data";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      id?: string;
      planId?: string;
      northStarId?: string;
      year: number;
      label: string;
      revenueTarget?: number | null;
      profitMarginTarget?: number | null;
      keyConditions?: string[];
      revenueActual?: number | null;
      progressNote?: string | null;
    };

    if (!body.year || !body.label?.trim()) {
      return NextResponse.json({ error: "year, label required" }, { status: 400 });
    }

    let planId = body.planId;
    if (!planId) {
      const { plan } = await getActiveStrategicPlan(
        DEFAULT_GROUP_ORG_UNIT_ID,
        DEFAULT_HORIZON_START,
        DEFAULT_HORIZON_END,
      );
      planId = plan?.id;
    }

    const data = {
      year: body.year,
      label: body.label.trim(),
      revenueTarget: body.revenueTarget ?? null,
      profitMarginTarget: body.profitMarginTarget ?? null,
      keyConditions: body.keyConditions ?? [],
      revenueActual: body.revenueActual ?? null,
      progressNote: body.progressNote ?? null,
      riskFactors: [] as string[],
    };

    if (planId) {
      if (body.id && body.id.includes("-")) {
        const row = await prisma.planMilestone.update({
          where: { id: body.id },
          data: { ...data, planId },
        });
        return NextResponse.json({ id: row.id, planId });
      }

      const row = await prisma.planMilestone.create({
        data: { ...data, planId },
      });
      return NextResponse.json({ id: row.id, planId });
    }

    if (!body.northStarId) {
      return NextResponse.json({ error: "planId or northStarId required" }, { status: 400 });
    }

    const legacyData = { ...data, northStarId: body.northStarId };
    if (body.id) {
      const row = await prisma.compassMilestone.update({
        where: { id: body.id },
        data: legacyData,
      });
      return NextResponse.json({ id: row.id });
    }

    const row = await prisma.compassMilestone.create({ data: legacyData });
    return NextResponse.json({ id: row.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "save failed";
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const planId = searchParams.get("planId");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  if (planId) {
    await prisma.planMilestone.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  }

  try {
    await prisma.planMilestone.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    await prisma.compassMilestone.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  }
}
