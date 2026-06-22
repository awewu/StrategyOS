import { NextResponse } from "next/server";
import { getActivePeriod } from "@/lib/data/active-period";
import {
  getExecutionAnalytics,
  saveExecutionAnalytics,
} from "@/lib/fpa/execution-analytics-access";

export async function GET() {
  const bundle = await getExecutionAnalytics(await getActivePeriod());
  return NextResponse.json(bundle);
}

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as {
      period?: string;
      horizonBubbles?: unknown;
      riceItems?: unknown;
      trlRadar?: unknown;
    };
    if (!body.horizonBubbles || !body.riceItems || !body.trlRadar) {
      return NextResponse.json({ error: "缺少 horizonBubbles / riceItems / trlRadar" }, { status: 400 });
    }
    const saved = await saveExecutionAnalytics(
      {
        horizonBubbles: body.horizonBubbles as Parameters<typeof saveExecutionAnalytics>[0]["horizonBubbles"],
        riceItems: body.riceItems as Parameters<typeof saveExecutionAnalytics>[0]["riceItems"],
        trlRadar: body.trlRadar as Parameters<typeof saveExecutionAnalytics>[0]["trlRadar"],
      },
      body.period ?? await getActivePeriod(),
    );
    return NextResponse.json(saved);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "保存失败" },
      { status: 400 },
    );
  }
}
