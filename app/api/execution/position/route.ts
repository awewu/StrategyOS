import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
const PERIOD = "2026-FY";

export async function GET() {
  const rows = await prisma.competitivePosition.findMany({ where: { period: PERIOD }, orderBy: { createdAt: "asc" } });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  try {
    const b = await req.json();
    if (!b.competitor || !b.dimension) return NextResponse.json({ error: "competitor/dimension 必填" }, { status: 400 });
    const data = {
      period: b.period ?? PERIOD,
      competitor: b.competitor, dimension: b.dimension,
      ourValue: b.ourValue || null, theirValue: b.theirValue || null,
      delta: b.delta || null, evidenceSource: b.evidenceSource || null,
      recordedBy: b.recordedBy || null,
      recordedAt: b.recordedAt ? new Date(b.recordedAt) : null,
    };
    const row = b.id
      ? await prisma.competitivePosition.update({ where: { id: b.id }, data })
      : await prisma.competitivePosition.create({ data });
    return NextResponse.json({ ok: true, position: row });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    await prisma.competitivePosition.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
