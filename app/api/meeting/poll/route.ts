import { NextResponse } from "next/server";
import { requireApiMinLevel } from "@/lib/auth/api-guard";
import { closeMeetingPoll } from "@/lib/delivery/meeting-close";
import { dbAvailable, prisma } from "@/lib/db";

export async function GET() {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;

  if (!(await dbAvailable())) return NextResponse.json({ polls: [], db: false });
  const polls = await prisma.meetingPoll.findMany({
    where: { status: "OPEN" },
    include: { responses: true, meeting: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return NextResponse.json({ polls, db: true });
}

export async function POST(req: Request) {
  try {
    const denied = await requireApiMinLevel(2);
    if (denied) return denied;

    if (!(await dbAvailable())) return NextResponse.json({ error: "db unavailable" }, { status: 503 });
    const body = (await req.json()) as {
      action: "create" | "vote" | "close";
      pollType?: "PRIORITY" | "RESOLUTION" | "PULSE";
      question?: string;
      options?: string[];
      meetingId?: string;
      pollId?: string;
      voterLabel?: string;
      choiceKey?: string;
      pulseScore?: number;
      linkedInboxSourceKey?: string;
      closeInboxSourceKey?: string;
    };

    if (body.action === "create") {
      if (!body.question?.trim()) return NextResponse.json({ error: "question required" }, { status: 400 });
      const poll = await prisma.meetingPoll.create({
        data: {
          pollType: body.pollType ?? "RESOLUTION",
          question: body.question.trim(),
          optionsJson: body.options ?? ["赞成", "反对", "搁置"],
          meetingId: body.meetingId ?? null,
          linkedInboxSourceKey: body.linkedInboxSourceKey ?? null,
        },
      });
      return NextResponse.json({ ok: true, poll });
    }

    if (body.action === "vote") {
      if (!body.pollId) return NextResponse.json({ error: "pollId required" }, { status: 400 });
      const response = await prisma.meetingPollResponse.create({
        data: {
          pollId: body.pollId,
          voterLabel: body.voterLabel ?? "匿名",
          choiceKey: body.choiceKey ?? null,
          pulseScore: body.pulseScore ?? null,
        },
      });
      return NextResponse.json({ ok: true, response });
    }

    if (body.action === "close") {
      if (!body.pollId) return NextResponse.json({ error: "pollId required" }, { status: 400 });
      const inboxKey = body.closeInboxSourceKey;
      if (inboxKey) {
        await prisma.meetingPoll.update({
          where: { id: body.pollId },
          data: { linkedInboxSourceKey: inboxKey },
        });
      }
      const result = await closeMeetingPoll(body.pollId);
      return NextResponse.json({ ok: true, ...result });
    }

    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
