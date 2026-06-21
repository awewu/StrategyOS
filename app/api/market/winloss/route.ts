import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

type Outcome = "win" | "loss" | "no_decision";

/** 大区录入赢丢单复盘 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, outcome, regionId, competitorId, productLineId, projectName, dealSizeCny, lossReason, winReason, customerType, recordedAt } = body;
    if (!outcome || !regionId) return NextResponse.json({ error: "outcome/regionId 必填" }, { status: 400 });
    const data = {
      outcome: outcome as Outcome, regionId, competitorId: competitorId ?? null,
      productLineId: productLineId ?? null, projectName: projectName ?? null,
      dealSizeCny: dealSizeCny ?? null, lossReason: lossReason ?? null, winReason: winReason ?? null,
      customerType: customerType ?? null, recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
    };
    const rec = id
      ? await prisma.winLossRecord.update({ where: { id }, data })
      : await prisma.winLossRecord.create({ data });
    return NextResponse.json({ success: true, record: rec });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.winLossRecord.delete({ where: { id } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
