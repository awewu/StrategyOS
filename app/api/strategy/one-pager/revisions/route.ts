import { NextResponse } from "next/server";
import { listStrategyOnePagerRevisions } from "@/lib/strategy/one-pager-store";

export async function GET() {
  try {
    const revisions = await listStrategyOnePagerRevisions();
    return NextResponse.json({ revisions });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "list revisions failed";
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}
