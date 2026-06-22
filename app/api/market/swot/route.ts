import { NextResponse } from "next/server";
import { demoInternalSwot, demoSignals } from "@/lib/market-intel/demo-data";
import { askSwotAi } from "@/lib/market-intel/market-ask-llm";
import { buildSwot } from "@/lib/market-intel/swot";
import type { IntelSignal } from "@/lib/market-intel/types";
import type { SwotItem } from "@/lib/market-intel/swot";

export async function POST(req: Request) {
  let body: { signals?: IntelSignal[]; internal?: SwotItem[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "无效 JSON" }, { status: 400 });
  }

  const signals = body.signals?.length ? body.signals : demoSignals;
  const internal = body.internal?.length ? body.internal : demoInternalSwot;
  const board = buildSwot(signals, internal);

  const result = await askSwotAi(board);
  return NextResponse.json({ ...result, board });
}
