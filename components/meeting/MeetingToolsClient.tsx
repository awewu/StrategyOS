"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Poll = {
  id: string;
  pollType: string;
  question: string;
  optionsJson: string[];
  status: string;
  responses: { id: string; voterLabel: string | null; choiceKey: string | null; pulseScore: number | null }[];
};

export function MeetingToolsClient() {
  const router = useRouter();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [question, setQuestion] = useState("是否批准 H2/H3 CAPEX 冻结方案？");
  const [linkedInbox, setLinkedInbox] = useState("");
  const [pollType, setPollType] = useState<"RESOLUTION" | "PRIORITY" | "PULSE">("RESOLUTION");
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/meeting/poll");
    const json = (await res.json()) as { polls: Poll[] };
    setPolls(json.polls ?? []);
  }

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/meeting/poll")
      .then((res) => res.json())
      .then((json: { polls: Poll[] }) => {
        if (!cancelled) setPolls(json.polls ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function createPoll() {
    setBusy(true);
    try {
      await fetch("/api/meeting/poll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          pollType,
          question,
          options: pollType === "PULSE" ? [] : ["赞成", "反对", "搁置"],
          linkedInboxSourceKey: linkedInbox.trim() || undefined,
        }),
      });
      await load();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function vote(pollId: string, choiceKey?: string, pulseScore?: number) {
    await fetch("/api/meeting/poll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "vote",
        pollId,
        voterLabel: "CEO",
        choiceKey,
        pulseScore,
      }),
    });
    await load();
  }

  async function closePoll(pollId: string) {
    await fetch("/api/meeting/poll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "close", pollId }),
    });
    await load();
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-[var(--surface-border)] bg-[var(--surface-panel)] p-6">
        <h2 className="text-base font-semibold">发起表决 / 脉搏</h2>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          表决结果可关闭 Inbox 议题 · 写回见「议题 Inbox」指派承诺
        </p>
        <div className="mt-4 space-y-3">
          <select
            className="rounded-md border border-[var(--surface-border)] px-3 py-2 text-sm"
            value={pollType}
            onChange={(e) => setPollType(e.target.value as typeof pollType)}
          >
            <option value="RESOLUTION">决议表决</option>
            <option value="PRIORITY">优先级投票</option>
            <option value="PULSE">会中脉搏 1–5</option>
          </select>
          <input
            className="w-full rounded-md border border-[var(--surface-border)] px-3 py-2 text-sm"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <input
            className="w-full rounded-md border border-[var(--surface-border)] px-3 py-2 text-sm"
            placeholder="关联 Inbox sourceKey（可选，关闭表决时自动关议题）"
            value={linkedInbox}
            onChange={(e) => setLinkedInbox(e.target.value)}
          />
          <button
            type="button"
            disabled={busy || !question.trim()}
            onClick={createPoll}
            className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            创建
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-semibold">进行中</h2>
        {polls.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">暂无开放投票 · 创建后将显示在此</p>
        ) : (
          polls.map((poll) => {
            const opts = Array.isArray(poll.optionsJson) ? poll.optionsJson : [];
            return (
              <div key={poll.id} className="rounded-xl border border-[var(--surface-border)] p-5">
                <p className="text-sm font-medium">{poll.question}</p>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  {poll.pollType} · {poll.responses.length} 票
                </p>
                {poll.pollType === "PULSE" ? (
                  <div className="mt-3 flex gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => vote(poll.id, undefined, n)}
                        className="rounded border border-[var(--surface-border)] px-3 py-1 text-sm hover:bg-black/[0.04]"
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {opts.map((o) => (
                      <button
                        key={o}
                        type="button"
                        onClick={() => vote(poll.id, o)}
                        className="rounded border border-[var(--surface-border)] px-3 py-1 text-sm hover:bg-black/[0.04]"
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => closePoll(poll.id)}
                  className="mt-3 text-xs text-[var(--color-text-muted)] hover:underline"
                >
                  结束并归档
                </button>
              </div>
            );
          })
        )}
      </section>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/inbox" className="text-[var(--color-accent)] hover:underline">
          议题 Inbox →
        </Link>
        <Link href="/council?tab=rehearsal" className="text-[var(--color-text-muted)] hover:underline">
          Q3 彩排 →
        </Link>
        <Link href="/mandates" className="text-[var(--color-text-muted)] hover:underline">
          战略职责 →
        </Link>
      </div>
    </div>
  );
}
