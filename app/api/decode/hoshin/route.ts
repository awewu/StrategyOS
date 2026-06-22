import { NextResponse } from "next/server";
import { requireApiMinLevel } from "@/lib/auth/api-guard";
import {
  getDecodeHoshin,
  saveDecodeHoshin,
  type HoshinRowPayload,
} from "@/lib/decode/data-access";
import { getActivePeriod } from "@/lib/data/active-period";

export async function GET() {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;
  const period = await getActivePeriod();
  const { quadrants, flat, source } = await getDecodeHoshin(period);
  return NextResponse.json({ period, quadrants, rows: flat, source });
}

export async function PUT(req: Request) {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;
  try {
    const body = (await req.json()) as { rows?: HoshinRowPayload[]; period?: string };
    const rows = body.rows ?? [];
    if (rows.length === 0) {
      return NextResponse.json({ error: "至少一行 X-Matrix 数据" }, { status: 400 });
    }
    for (const r of rows) {
      if (!r.rowLabel?.trim() || !r.colLabel?.trim() || !r.label?.trim()) {
        return NextResponse.json({ error: "行标签、列标签、条目为必填" }, { status: 400 });
      }
    }
    const period = body.period ?? await getActivePeriod();
    const result = await saveDecodeHoshin(rows, period);
    return NextResponse.json({ ok: true, ...result, period });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "保存失败" }, { status: 500 });
  }
}
