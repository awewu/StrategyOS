import { NextResponse } from "next/server";
import { requireApiMinLevel } from "@/lib/auth/api-guard";
import {
  getGateChecklists,
  gateSummaryFrom,
  saveGateChecklists,
} from "@/lib/gates/data-access";
import { getActivePeriod } from "@/lib/data/active-period";
import type { GateChecklist } from "@/lib/gates/checklists";

export async function GET() {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;
  const period = await getActivePeriod();
  const { checklists, source } = await getGateChecklists(period);
  return NextResponse.json({ period, checklists, summary: gateSummaryFrom(checklists), source });
}

export async function PUT(req: Request) {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;
  try {
    const body = (await req.json()) as { checklists?: GateChecklist[]; period?: string };
    const checklists = body.checklists ?? [];
    if (checklists.length === 0) {
      return NextResponse.json({ error: "至少一个 Gate 清单" }, { status: 400 });
    }
    const period = body.period ?? await getActivePeriod();
    const result = await saveGateChecklists(checklists, period);
    return NextResponse.json({
      ok: true,
      ...result,
      period,
      summary: gateSummaryFrom(checklists),
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "保存失败" }, { status: 500 });
  }
}
