"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { StrategicTimeline } from "@/components/command/StrategicTimeline";
import type { TimelineMilestone } from "@/lib/command/timeline";

const KIND_OPTS: TimelineMilestone["kind"][] = ["snapshot", "meeting", "gate"];
const STATUS_OPTS: TimelineMilestone["status"][] = ["done", "active", "upcoming"];

const KIND_LABEL: Record<TimelineMilestone["kind"], string> = {
  snapshot: "版本快照",
  meeting: "战略会",
  gate: "Gate",
};

const STATUS_LABEL: Record<TimelineMilestone["status"], string> = {
  done: "已完成",
  active: "进行中",
  upcoming: "待启动",
};

export function TimelineEditor({
  initialMilestones,
  derivedMilestones,
  source,
}: {
  initialMilestones: TimelineMilestone[];
  derivedMilestones: TimelineMilestone[];
  source: "database" | "derived";
}) {
  const router = useRouter();
  const [milestones, setMilestones] = useState(initialMilestones);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function patch(index: number, field: keyof TimelineMilestone, value: string) {
    setMilestones((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)),
    );
  }

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/command/decisions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timeline: milestones }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "保存失败");
      setEditing(false);
      setMsg("战略时间轴已保存");
      router.refresh();
      window.setTimeout(() => setMsg(null), 3500);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }

  async function resetDerived() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/command/decisions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset: "timeline" }),
      });
      if (!res.ok) throw new Error("重置失败");
      setMilestones(derivedMilestones);
      setEditing(false);
      setMsg("已恢复自动推导时间轴");
      router.refresh();
      window.setTimeout(() => setMsg(null), 3500);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "重置失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <span className="text-caption">
          战略时间轴 {source === "database" ? "· 已自定义" : "· 版本库推导"}
        </span>
        {msg ? <span className="text-xs text-[var(--signal-green-text)]">{msg}</span> : null}
        {editing ? (
          <>
            <button
              type="button"
              className="stratos-btn stratos-btn--ghost px-3 py-1.5 text-xs"
              onClick={() => {
                setMilestones(initialMilestones);
                setEditing(false);
              }}
            >
              取消
            </button>
            <button
              type="button"
              disabled={busy}
              className="stratos-btn stratos-btn--primary px-3 py-1.5 text-xs"
              onClick={() => void save()}
            >
              {busy ? "保存中…" : "保存"}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="stratos-btn stratos-btn--ghost px-3 py-1.5 text-xs"
              onClick={() => setEditing(true)}
            >
              编辑时间轴
            </button>
            {source === "database" ? (
              <button
                type="button"
                disabled={busy}
                className="stratos-btn stratos-btn--ghost px-3 py-1.5 text-xs"
                onClick={() => void resetDerived()}
              >
                恢复推导
              </button>
            ) : null}
          </>
        )}
      </div>

      {editing ? (
        <div className="stratos-card space-y-3 p-4">
          {milestones.map((m, i) => (
            <div
              key={m.id}
              className="grid gap-2 rounded-lg border border-[var(--surface-border)] p-3 sm:grid-cols-2 lg:grid-cols-3"
            >
              <input
                className="rounded border px-2 py-1 text-xs sm:col-span-2"
                value={m.label}
                onChange={(e) => patch(i, "label", e.target.value)}
                placeholder="标签"
              />
              <input
                className="rounded border px-2 py-1 text-xs font-data"
                value={m.period}
                onChange={(e) => patch(i, "period", e.target.value)}
                placeholder="期间"
              />
              <input
                className="rounded border px-2 py-1 text-xs sm:col-span-2"
                value={m.detail ?? ""}
                onChange={(e) => patch(i, "detail", e.target.value)}
                placeholder="说明"
              />
              <select
                className="rounded border px-2 py-1 text-xs"
                value={m.kind}
                onChange={(e) => patch(i, "kind", e.target.value)}
              >
                {KIND_OPTS.map((k) => (
                  <option key={k} value={k}>
                    {KIND_LABEL[k]}
                  </option>
                ))}
              </select>
              <select
                className="rounded border px-2 py-1 text-xs"
                value={m.status}
                onChange={(e) => patch(i, "status", e.target.value)}
              >
                {STATUS_OPTS.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      ) : (
        <StrategicTimeline milestones={milestones} />
      )}
    </div>
  );
}
