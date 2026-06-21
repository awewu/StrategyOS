import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const MONTH_RE = /^\d{4}-\d{2}$/;

export async function GET(req: Request) {
  const metricId = new URL(req.url).searchParams.get("metricId");
  const rows = await prisma.opsMetricActual.findMany({
    where: metricId ? { metricId } : undefined,
    orderBy: { month: "asc" },
  });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  try {
    const { metricId, month, actual, planned } = await req.json();
    if (!metricId || !month || !MONTH_RE.test(month)) {
      return NextResponse.json({ error: "metricId 与 month(YYYY-MM) 必填" }, { status: 400 });
    }
    if (planned == null || Number.isNaN(Number(planned))) {
      return NextResponse.json({ error: "planned 目标值必填" }, { status: 400 });
    }
    const data = {
      metricId,
      month,
      actual: actual == null ? null : Number(actual),
      planned: Number(planned),
    };
    const row = await prisma.opsMetricActual.upsert({
      where: { metricId_month: { metricId, month } },
      create: data,
      update: { actual: data.actual, planned: data.planned },
    });
    return NextResponse.json({ ok: true, point: row });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    await prisma.opsMetricActual.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
