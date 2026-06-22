import { NextResponse } from "next/server";
import { requireApiMinLevel } from "@/lib/auth/api-guard";
import { getDecodeBsc, saveDecodeBsc } from "@/lib/decode/data-access";
import { getActivePeriod } from "@/lib/data/active-period";
import type { BscDimensionRow } from "@/lib/decode/bsc-map";
import type { TrafficLight } from "@/lib/types/stratos";

export async function GET() {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;
  const period = await getActivePeriod();
  const { rows, source } = await getDecodeBsc(period);
  return NextResponse.json({ period, rows, source });
}

export async function PUT(req: Request) {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;
  try {
    const body = (await req.json()) as { rows?: BscDimensionRow[]; period?: string };
    const rows = body.rows ?? [];
    if (rows.length === 0) {
      return NextResponse.json({ error: "至少一行 BSC 数据" }, { status: 400 });
    }
    for (const r of rows) {
      if (!r.dim?.trim()) {
        return NextResponse.json({ error: "维度不能为空" }, { status: 400 });
      }
      const lights: TrafficLight[] = ["green", "yellow", "red"];
      if (!lights.includes(r.mustWinStatus) || !lights.includes(r.notFailStatus)) {
        return NextResponse.json({ error: "灯色须为 green / yellow / red" }, { status: 400 });
      }
    }
    const period = body.period ?? await getActivePeriod();
    const result = await saveDecodeBsc(rows, period);
    return NextResponse.json({ ok: true, ...result, period });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "保存失败" }, { status: 500 });
  }
}
