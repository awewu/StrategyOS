import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      id?: string;
      northStarId: string;
      year: number;
      label: string;
      revenueTarget?: number | null;
      profitMarginTarget?: number | null;
      keyConditions?: string[];
      revenueActual?: number | null;
      progressNote?: string | null;
    };

    if (!body.northStarId || !body.year || !body.label?.trim()) {
      return NextResponse.json({ error: "northStarId, year, label required" }, { status: 400 });
    }

    const data = {
      northStarId: body.northStarId,
      year: body.year,
      label: body.label.trim(),
      revenueTarget: body.revenueTarget ?? null,
      profitMarginTarget: body.profitMarginTarget ?? null,
      keyConditions: body.keyConditions ?? [],
      revenueActual: body.revenueActual ?? null,
      progressNote: body.progressNote ?? null,
      riskFactors: [] as string[],
    };

    if (body.id) {
      const row = await prisma.compassMilestone.update({
        where: { id: body.id },
        data,
      });
      return NextResponse.json({ id: row.id });
    }

    const row = await prisma.compassMilestone.create({ data });
    return NextResponse.json({ id: row.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "save failed";
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.compassMilestone.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
