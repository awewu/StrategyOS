import { NextResponse } from "next/server";
import { getActivePeriod } from "@/lib/data/active-period";
import { getGrowthAnalytics, saveGrowthAnalytics } from "@/lib/fpa/growth-analytics-access";

export async function GET() {
  const bundle = await getGrowthAnalytics(await getActivePeriod());
  return NextResponse.json(bundle);
}

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as {
      period?: string;
      aarrrFunnel?: unknown;
      kellerBrandLayers?: unknown;
    };
    if (!body.aarrrFunnel || !body.kellerBrandLayers) {
      return NextResponse.json({ error: "缺少 aarrrFunnel / kellerBrandLayers" }, { status: 400 });
    }
    const saved = await saveGrowthAnalytics(
      {
        aarrrFunnel: body.aarrrFunnel as Parameters<typeof saveGrowthAnalytics>[0]["aarrrFunnel"],
        kellerBrandLayers: body.kellerBrandLayers as Parameters<
          typeof saveGrowthAnalytics
        >[0]["kellerBrandLayers"],
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
