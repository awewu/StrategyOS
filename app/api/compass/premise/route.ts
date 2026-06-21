import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.json();
  const { id, northStarId, ...data } = body as {
    id?: string; northStarId: string;
    code: string; premise: string; category: string;
    confidence: number; fragility: number;
    validationNote?: string; failSignal?: string; signalSource?: string;
  };
  if (id) {
    const row = await prisma.compassPremiseAudit.update({
      where: { id },
      data: { ...data, lastValidatedAt: new Date() },
    });
    return NextResponse.json({ id: row.id });
  }
  const row = await prisma.compassPremiseAudit.create({
    data: { northStarId, ...data, lastValidatedAt: new Date() },
  });
  return NextResponse.json({ id: row.id });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.compassPremiseAudit.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
