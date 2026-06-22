import { NextResponse } from "next/server";
import { getActivePeriod } from "@/lib/data/active-period";
import {
  clearCommandDecisions,
  clearCommandTimeline,
  getCommandDecisionsConfig,
  getCommandTimelineConfig,
  saveCommandDecisions,
  saveCommandTimeline,
} from "@/lib/command/decisions-access";
import type { TimelineMilestone } from "@/lib/command/timeline";
import type { DecisionItem } from "@/lib/panorama/scr";

export async function GET() {
  const [decisions, timeline] = await Promise.all([
    getCommandDecisionsConfig(await getActivePeriod()),
    getCommandTimelineConfig(await getActivePeriod()),
  ]);
  return NextResponse.json({ ...decisions, timeline: timeline.milestones, timelineSource: timeline.source });
}

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as {
      period?: string;
      decisions?: DecisionItem[];
      timeline?: TimelineMilestone[];
      reset?: boolean | "decisions" | "timeline";
    };
    const period = body.period ?? await getActivePeriod();

    if (body.reset === true || body.reset === "decisions") {
      await clearCommandDecisions(period);
      return NextResponse.json(await getCommandDecisionsConfig(period));
    }
    if (body.reset === "timeline") {
      await clearCommandTimeline(period);
      const timeline = await getCommandTimelineConfig(period);
      return NextResponse.json({ milestones: timeline.milestones, source: timeline.source });
    }
    if (body.timeline) {
      const saved = await saveCommandTimeline(body.timeline, period);
      return NextResponse.json(saved);
    }
    if (body.decisions) {
      const saved = await saveCommandDecisions(body.decisions, period);
      return NextResponse.json(saved);
    }
    return NextResponse.json({ error: "缺少 decisions / timeline / reset" }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "保存失败" },
      { status: 400 },
    );
  }
}
