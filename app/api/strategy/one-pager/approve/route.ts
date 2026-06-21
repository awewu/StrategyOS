import { NextResponse } from "next/server";
import type { ChinaStrategySummaryData } from "@/lib/strategy/china-strategy-summary";
import { normalizeChinaStrategyContent } from "@/lib/strategy/china-strategy-summary";
import { approveStrategyOnePager } from "@/lib/strategy/one-pager-store";
import { validateOnePagerBeforeApprove } from "@/lib/strategy/one-pager-validation";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      content: ChinaStrategySummaryData;
      approvedBy?: string;
    };
    if (!body.content) {
      return NextResponse.json({ error: "content required" }, { status: 400 });
    }

    const normalized = normalizeChinaStrategyContent(body.content);
    const validation = validateOnePagerBeforeApprove(normalized);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.errors.join("；"), validation }, { status: 400 });
    }

    const record = await approveStrategyOnePager(normalized, body.approvedBy ?? "CEO");
    return NextResponse.json({ ...record, validation });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "approve failed";
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}
