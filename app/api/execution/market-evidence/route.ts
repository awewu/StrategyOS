import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getActivePeriod } from "@/lib/data/active-period";

export const runtime = "nodejs";

export async function GET() {
  const rows = await prisma.marketEvidence.findMany({ where: { period: await getActivePeriod() }, orderBy: { createdAt: "asc" } });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  try {
    const b = await req.json();
    if (!b.actionLabel) return NextResponse.json({ error: "actionLabel 必填" }, { status: 400 });
    const data = {
      period: b.period ?? (await getActivePeriod()),
      actionLabel: b.actionLabel, actionCode: b.actionCode || null,
      linkedAssumptionCode: b.linkedAssumptionCode || null,
      evidenceText: b.evidenceText || null, evidenceSource: b.evidenceSource || null,
      recordedBy: b.recordedBy || null,
      recordedAt: b.recordedAt ? new Date(b.recordedAt) : null,
      verdict: b.verdict ?? "empty", verdictNote: b.verdictNote || null,
    };
    const row = b.id
      ? await prisma.marketEvidence.update({ where: { id: b.id }, data })
      : await prisma.marketEvidence.create({ data });
    return NextResponse.json({ ok: true, evidence: row });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    await prisma.marketEvidence.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
