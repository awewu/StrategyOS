import { NextResponse } from "next/server";
import { reviseStrategyOnePager } from "@/lib/strategy/one-pager-store";

export async function POST() {
  try {
    const record = await reviseStrategyOnePager();
    return NextResponse.json(record);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "revise failed";
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}
