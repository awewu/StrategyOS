import { NextResponse } from "next/server";
import {
  normalizeChinaStrategyContent,
  type ChinaStrategySummaryData,
} from "@/lib/strategy/china-strategy-summary";
import {
  getStrategyOnePager,
  saveStrategyOnePagerDraft,
} from "@/lib/strategy/one-pager-store";

export async function GET() {
  const record = await getStrategyOnePager();
  return NextResponse.json(record);
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as { content: ChinaStrategySummaryData };
    if (!body.content) {
      return NextResponse.json({ error: "content required" }, { status: 400 });
    }
    const normalized = normalizeChinaStrategyContent(body.content);
    if (!normalized.title.trim() && !normalized.titleZh.trim()) {
      return NextResponse.json({ error: "请填写页标题（中文或英文至少一项）" }, { status: 400 });
    }
    const record = await saveStrategyOnePagerDraft(normalized);
    return NextResponse.json(record);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "save failed";
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}
