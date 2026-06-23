import { NextResponse } from "next/server";
import { requireApiMinLevel } from "@/lib/auth/api-guard";
import { briefContextForLlm, buildMarketBrief } from "@/lib/market-intel/brief";
import { demoSignals } from "@/lib/market-intel/demo-data";
import { askMarketAi } from "@/lib/market-intel/market-ask-llm";
import { rankSignals } from "@/lib/market-intel/hermes";
import type { IntelSignal } from "@/lib/market-intel/types";

export async function POST(req: Request) {
  const denied = await requireApiMinLevel(1);
  if (denied) return denied;
  let body: { question?: string; signals?: IntelSignal[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "无效 JSON" }, { status: 400 });
  }

  const question = body.question?.trim();
  if (!question || question.length < 4) {
    return NextResponse.json({ error: "请输入至少 4 个字的问题" }, { status: 400 });
  }

  const ranked = rankSignals(body.signals?.length ? body.signals : demoSignals);
  const brief = buildMarketBrief(ranked, 3);
  const context = briefContextForLlm(brief, ranked.slice(3, 8));

  const result = await askMarketAi(question, context);

  if ("fallback" in result && result.fallback) {
    return NextResponse.json({
      mode: "fallback",
      text: result.text,
      error: result.error,
    });
  }

  return NextResponse.json({ mode: "llm", ...result });
}
