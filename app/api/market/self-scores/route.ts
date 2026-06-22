import { NextResponse } from "next/server";
import { requireApiMinLevel } from "@/lib/auth/api-guard";
import {
  getMarketSelfScores,
  saveMarketSelfScores,
} from "@/lib/market-intel/swot-access";
import type { IntelDimension } from "@/lib/market-intel/types";

export async function GET() {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;
  const { scores, source } = await getMarketSelfScores();
  return NextResponse.json({ scores, source });
}

export async function PUT(req: Request) {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;
  try {
    const body = (await req.json()) as {
      scores?: Partial<Record<IntelDimension, number>>;
      period?: string;
    };
    if (!body.scores || typeof body.scores !== "object") {
      return NextResponse.json({ error: "缺少 scores" }, { status: 400 });
    }
    const { scores, source } = await saveMarketSelfScores(body.scores, body.period);
    return NextResponse.json({ ok: true, scores, source });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "保存失败" },
      { status: 500 },
    );
  }
}
