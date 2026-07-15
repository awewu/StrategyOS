import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiMinLevel } from "@/lib/auth/api-guard";
import { getActivePeriod } from "@/lib/data/active-period";

export const runtime = "nodejs";

const GAP_ACTIONS = ["invest", "outsource", "defer_demand"];

export async function GET() {
  const period = await getActivePeriod();
  const rows = await prisma.capacitySnapshot.findMany({
    where: { period },
    orderBy: { recordedAt: "desc" },
    take: 8,
  });
  return NextResponse.json(rows);
}

/** 新增一条产能快照（utilization/gap 由 demand/capacity 推导） */
export async function POST(req: Request) {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;
  try {
    const b = await req.json();
    const demand = Number(b.demandUnits);
    const capacity = Number(b.capacityUnits);
    if (!Number.isFinite(demand) || !Number.isFinite(capacity) || capacity <= 0) {
      return NextResponse.json({ error: "demandUnits/capacityUnits 需为正数" }, { status: 400 });
    }
    if (!GAP_ACTIONS.includes(b.gapAction)) {
      return NextResponse.json({ error: "gapAction 需为 invest/outsource/defer_demand" }, { status: 400 });
    }
    const row = await prisma.capacitySnapshot.create({
      data: {
        period: await getActivePeriod(),
        demandUnits: demand,
        capacityUnits: capacity,
        utilizationPct: Math.round((demand / capacity) * 10000) / 100,
        gapUnits: Math.round((demand - capacity) * 100) / 100,
        gapAction: b.gapAction,
        bottleneckAsset: b.bottleneckAsset?.trim() || null,
        recordedAt: new Date(),
      },
    });
    return NextResponse.json({ ok: true, snapshot: row });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "保存失败" }, { status: 500 });
  }
}
