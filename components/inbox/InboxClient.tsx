"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import type { InboxItemView } from "@/lib/inbox/persist";
import type { PipelineStatus } from "@/lib/inbox/aggregate";

const SEV_STYLE = {
  critical: "border-[var(--signal-red)]/35 bg-[var(--signal-red)]/6",
  warning: "border-[var(--signal-yellow)]/35 bg-[var(--signal-yellow)]/6",
  info: "border-[var(--surface-border)] bg-black/[0.02]",
};

const STATUS_LABEL = {
  OPEN: "待议",
  DEFERRED: "已推迟",
  ASSIGNED: "已指派",
  CLOSED: "已关闭",
};

export function PipelineStatusBar({ status }: { status: PipelineStatus }) {
  const [syncing, setSyncing] = useState(false);
  const router = useRouter();

  async function syncRunway() {
    setSyncing(true);
    try {
      await fetch("/api/fpa/sync-runway", { method: "POST" });
      router.refresh();
    } finally {
      setSyncing(false);
    }
  }

  return (
    <section className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-panel)] px-4 py-3 text-xs">
      <span className={status.fpaReady ? "text-[var(--signal-green)]" : "text-[var(--signal-yellow)]"}>
        FPA / Runway {status.fpaReady ? "已接入" : "待同步"} · {status.runwayMonths?.toFixed(1) ?? "—"} 月
      </span>
      <button
        type="button"
        disabled={syncing}
        onClick={syncRunway}
        className="rounded border border-[var(--surface-border)] px-2 py-0.5 text-[var(--color-accent)] hover:bg-black/[0.04] disabled:opacity-60"
      >
        {syncing ? "同步中…" : "同步 Runway"}
      </button>
      <span className="text-[var(--color-text-muted)]">|</span>
      <span>
        月报 {status.approvedReports} 存档 · {status.orgBoundReports} 已绑 org
      </span>
      <Link href="/reports" className="ml-auto text-[var(--color-accent)] hover:underline">
        OPS 导入 →
      </Link>
    </section>
  );
}

export function InboxClient({ initialItems }: { initialItems: InboxItemView[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [busy, setBusy] = useState<string | null>(null);
  const [assignFor, setAssignFor] = useState<string | null>(null);
  const [ownerName, setOwnerName] = useState("");
  const [deadline, setDeadline] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });

  async function dispose(sourceKey: string, action: "close" | "defer" | "assign", extra?: Record<string, string>) {
    setBusy(sourceKey);
    try {
      const res = await fetch("/api/inbox", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceKey, action, ...extra }),
      });
      const json = (await res.json()) as { items?: InboxItemView[]; error?: string };
      if (!res.ok) throw new Error(json.error);
      if (json.items) setItems(json.items);
      setAssignFor(null);
      router.refresh();
    } catch {
      /* keep UI */
    } finally {
      setBusy(null);
    }
  }

  if (items.length === 0) {
    return (
      <EmptyState title="暂无待议议题" hint="告警与失效信号将自动汇入" />
    );
  }

  return (
    <ul className="space-y-3" id="decisions">
      {items.map((item) => (
        <li
          key={item.sourceKey}
          className={`rounded-xl border px-5 py-4 ${SEV_STYLE[item.severity]}`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-black/[0.05] px-1.5 py-0.5 text-caption">
                  {STATUS_LABEL[item.status]}
                </span>
                <span className="text-[11px] uppercase tracking-wide text-[var(--color-text-muted)]">
                  {item.source}
                </span>
              </div>
              <Link href={item.href} className="mt-1 block text-sm font-medium text-[var(--color-text-primary)] hover:underline">
                {item.title}
              </Link>
              <p className="mt-1 line-clamp-2 text-xs text-[var(--color-text-secondary)]">{item.summary}</p>
              {item.ownerName ? (
                <p className="mt-1 text-xs text-[var(--color-accent)]">负责人 {item.ownerName}</p>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-wrap gap-1.5">
              <button
                type="button"
                disabled={busy === item.sourceKey}
                onClick={() => dispose(item.sourceKey, "close", { resolution: "已议" })}
                className="rounded-md border border-[var(--surface-border)] px-2.5 py-1 text-xs hover:bg-black/[0.04] disabled:opacity-60"
              >
                已议
              </button>
              <button
                type="button"
                disabled={busy === item.sourceKey}
                onClick={() => dispose(item.sourceKey, "defer")}
                className="rounded-md border border-[var(--surface-border)] px-2.5 py-1 text-xs hover:bg-black/[0.04] disabled:opacity-60"
              >
                推迟
              </button>
              <button
                type="button"
                disabled={busy === item.sourceKey}
                onClick={() => setAssignFor(assignFor === item.sourceKey ? null : item.sourceKey)}
                className="rounded-md border border-[var(--color-accent)]/40 px-2.5 py-1 text-xs text-[var(--color-accent)] hover:bg-[var(--color-accent)]/5 disabled:opacity-60"
              >
                指派
              </button>
            </div>
          </div>
          {assignFor === item.sourceKey ? (
            <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-[var(--surface-border)] pt-3">
              <label className="text-xs">
                负责人
                <input
                  className="ml-1 rounded border border-[var(--surface-border)] px-2 py-1 text-sm"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="姓名"
                />
              </label>
              <label className="text-xs">
                截止
                <input
                  type="date"
                  className="ml-1 rounded border border-[var(--surface-border)] px-2 py-1 text-sm"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </label>
              <button
                type="button"
                disabled={!ownerName.trim() || busy === item.sourceKey}
                onClick={() => dispose(item.sourceKey, "assign", { ownerName, deadline })}
                className="rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-xs text-white disabled:opacity-60"
              >
                写入承诺账本
              </button>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
