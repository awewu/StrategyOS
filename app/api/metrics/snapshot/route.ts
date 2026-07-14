import { NextResponse } from "next/server";
import { requireApiMinLevel } from "@/lib/auth/api-guard";
import { captureMetricSnapshots } from "@/lib/metrics/snapshots";
import { getActivePeriod } from "@/lib/data/active-period";

export const runtime = "nodejs";

/** 手动触发当期指标快照（幂等 upsert，可重复调用/接外部调度器） */
export async function POST() {
  const denied = await requireApiMinLevel(3);
  if (denied) return denied;
  const captured = await captureMetricSnapshots();
  return NextResponse.json({ ok: true, period: await getActivePeriod(), captured });
}
