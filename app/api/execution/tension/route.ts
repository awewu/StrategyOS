import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getActivePeriod } from "@/lib/data/active-period";

export const runtime = "nodejs";

export async function GET() {
  const rows = await prisma.executionTension.findMany({ where: { period: await getActivePeriod() }, orderBy: { createdAt: "asc" } });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  try {
    const b = await req.json();
    if (!b.projectCode || !b.projectName || !b.tensionType || !b.signal) {
      return NextResponse.json({ error: "projectCode/projectName/tensionType/signal 必填" }, { status: 400 });
    }
    const data = {
      period: b.period ?? (await getActivePeriod()),
      projectCode: b.projectCode, projectName: b.projectName,
      tensionType: b.tensionType, signal: b.signal,
      diagnosis: b.diagnosis ?? "", recommendation: b.recommendation ?? "",
      severity: b.severity ?? "medium",
      linkedAssumptionCode: b.linkedAssumptionCode || null,
      linkedKr: b.linkedKr || null,
    };
    const row = b.id
      ? await prisma.executionTension.update({ where: { id: b.id }, data })
      : await prisma.executionTension.create({ data });
    return NextResponse.json({ ok: true, tension: row });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    await prisma.executionTension.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
