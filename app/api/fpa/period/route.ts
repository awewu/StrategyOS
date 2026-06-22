import { NextResponse } from "next/server";
import { requireApiMinLevel } from "@/lib/auth/api-guard";
import { getFpaEditable, saveFpaEditable } from "@/lib/fpa/data-access";
import * as demo from "@/lib/stratos-demo-data";

export async function GET() {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;
  const { fpa, source } = await getFpaEditable(demo.CURRENT_PERIOD);
  return NextResponse.json({ period: demo.CURRENT_PERIOD, fpa, source });
}

export async function PUT(req: Request) {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;
  try {
    const body = (await req.json()) as {
      fpa?: {
        revenueBudget: number;
        revenueActual: number;
        revenueForecast: number;
        profitBudget: number;
        profitActual: number;
        profitForecast: number;
        cashRunwayMonths: number;
      };
      period?: string;
    };
    const fpa = body.fpa;
    if (!fpa) return NextResponse.json({ error: "fpa 必填" }, { status: 400 });
    const saved = await saveFpaEditable(fpa, body.period ?? demo.CURRENT_PERIOD);
    return NextResponse.json({ ok: true, fpa: saved });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "保存失败" }, { status: 500 });
  }
}
