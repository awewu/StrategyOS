import { NextResponse } from "next/server";
import { requireApiMinLevel } from "@/lib/auth/api-guard";
import {
  getRobustView,
  saveTwelveDim,
  type TwelveDimRowPayload,
} from "@/lib/health/twelve-dim-access";
import { getActivePeriod } from "@/lib/data/active-period";

export async function GET() {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;
  const period = await getActivePeriod();
  const view = await getRobustView(period);
  return NextResponse.json({ period, view });
}

export async function PUT(req: Request) {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;
  try {
    const body = (await req.json()) as { rows?: TwelveDimRowPayload[]; period?: string };
    const rows = body.rows ?? [];
    if (rows.length === 0) {
      return NextResponse.json({ error: "至少一维评分" }, { status: 400 });
    }
    const period = body.period ?? (await getActivePeriod());
    const result = await saveTwelveDim(rows, period);
    return NextResponse.json({ ok: true, ...result, period });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "保存失败" }, { status: 500 });
  }
}
