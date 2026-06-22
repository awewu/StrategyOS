import { NextResponse } from "next/server";
import { getActivePeriod } from "@/lib/data/active-period";
import { getBscConfig, saveBscConfig } from "@/lib/fpa/bsc-config-access";

export async function GET() {
  const bundle = await getBscConfig(await getActivePeriod());
  return NextResponse.json(bundle);
}

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as { period?: string; cards?: unknown };
    if (!body.cards) {
      return NextResponse.json({ error: "缺少 cards" }, { status: 400 });
    }
    const saved = await saveBscConfig(
      body.cards as Parameters<typeof saveBscConfig>[0],
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
