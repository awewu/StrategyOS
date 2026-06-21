import { dbAvailable, prisma } from "@/lib/db";
import { disposeInboxItem } from "@/lib/inbox/persist";

export type PollCloseResult = {
  tallySummary: string;
  closedInbox: boolean;
};

/** 计票并关闭投票；若绑定 Inbox sourceKey 则同步关闭议题 */
export async function closeMeetingPoll(pollId: string): Promise<PollCloseResult> {
  if (!(await dbAvailable())) throw new Error("database unavailable");

  const poll = await prisma.meetingPoll.findUnique({
    where: { id: pollId },
    include: { responses: true },
  });
  if (!poll) throw new Error("poll not found");

  let tallySummary = "会议表决关闭";

  if (poll.pollType === "PULSE" && poll.responses.length > 0) {
    const avg =
      poll.responses.reduce((s, r) => s + (r.pulseScore ?? 0), 0) / poll.responses.length;
    tallySummary = `会中脉搏均值 ${avg.toFixed(1)} / 5（${poll.responses.length} 票）`;
  } else if (poll.responses.length > 0) {
    const tallies = new Map<string, number>();
    for (const r of poll.responses) {
      const key = r.choiceKey ?? "—";
      tallies.set(key, (tallies.get(key) ?? 0) + 1);
    }
    const sorted = [...tallies.entries()].sort((a, b) => b[1] - a[1]);
    const [winner, votes] = sorted[0] ?? ["—", 0];
    tallySummary = `会议表决：${winner}（${votes} 票 / 共 ${poll.responses.length} 票）`;
  }

  await prisma.meetingPoll.update({
    where: { id: pollId },
    data: { status: "CLOSED" },
  });

  let closedInbox = false;
  if (poll.linkedInboxSourceKey) {
    await disposeInboxItem(poll.linkedInboxSourceKey, "close", {
      resolution: tallySummary,
    });
    closedInbox = true;
  }

  return { tallySummary, closedInbox };
}
