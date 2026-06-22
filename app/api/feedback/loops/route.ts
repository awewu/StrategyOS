import { NextResponse } from "next/server";
import { requireApiMinLevel } from "@/lib/auth/api-guard";
import {
  getFeedbackLoops,
  saveFeedbackLoops,
} from "@/lib/feedback/data-access";
import { getActivePeriod } from "@/lib/data/active-period";
import type { FeedbackLoop } from "@/lib/types/stratos";

export async function GET() {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;
  const period = await getActivePeriod();
  const { loops, source } = await getFeedbackLoops(period);
  return NextResponse.json({ period, loops, source });
}

export async function PUT(req: Request) {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;
  try {
    const body = (await req.json()) as { loops?: FeedbackLoop[]; period?: string };
    const loops = body.loops ?? [];
    if (loops.length === 0) {
      return NextResponse.json({ error: "至少一条反馈环" }, { status: 400 });
    }
    const period = body.period ?? await getActivePeriod();
    const result = await saveFeedbackLoops(loops, period);
    return NextResponse.json({ ok: true, ...result, period });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "保存失败" }, { status: 500 });
  }
}
