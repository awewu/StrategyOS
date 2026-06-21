import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
const PERIOD = "2026-FY";

export async function GET() {
  const rows = await prisma.executionMaturity.findMany({ where: { period: PERIOD }, orderBy: { updatedAt: "asc" } });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  try {
    const b = await req.json();
    if (!b.projectCode || !b.projectName) return NextResponse.json({ error: "projectCode/projectName 必填" }, { status: 400 });
    const data = {
      period: b.period ?? PERIOD,
      projectCode: b.projectCode, projectName: b.projectName,
      owner: b.owner ?? "", 
      milestoneOnTimeRate: b.milestoneOnTimeRate ?? 0,
      assumptionHitRate: b.assumptionHitRate ?? 0,
      responseLatencyDays: b.responseLatencyDays ?? 0,
      budgetTotal: b.budgetTotal ?? 0,
      tensionType: b.tensionType ?? "capability",
      horizon: b.horizon ?? "H1",
    };
    const row = await prisma.executionMaturity.upsert({
      where: { period_projectCode: { period: data.period, projectCode: data.projectCode } },
      create: data, update: data,
    });
    return NextResponse.json({ ok: true, maturity: row });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    await prisma.executionMaturity.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
