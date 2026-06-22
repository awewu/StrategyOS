import { NextResponse } from "next/server";
import { requireApiMinLevel } from "@/lib/auth/api-guard";
import { getCapitalConfig, saveCapitalConfig } from "@/lib/fpa/capital-config-access";
import type { PostInvestDeviation, RealOptionTag } from "@/lib/types/stratos";
import * as demo from "@/lib/stratos-demo-data";

export async function GET() {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;
  const bundle = await getCapitalConfig(demo.CURRENT_PERIOD);
  return NextResponse.json(bundle);
}

export async function PUT(req: Request) {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;
  try {
    const body = (await req.json()) as {
      realOptions?: RealOptionTag[];
      postInvestDeviations?: PostInvestDeviation[];
      period?: string;
    };
    if (!body.realOptions || !body.postInvestDeviations) {
      return NextResponse.json({ error: "realOptions 与 postInvestDeviations 必填" }, { status: 400 });
    }
    const saved = await saveCapitalConfig(
      { realOptions: body.realOptions, postInvestDeviations: body.postInvestDeviations },
      body.period ?? demo.CURRENT_PERIOD,
    );
    return NextResponse.json({ ok: true, ...saved });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "保存失败" }, { status: 500 });
  }
}
