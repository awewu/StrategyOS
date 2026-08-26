"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** 坚守驾驶舱就地轻操作：标记完成 / 催办（不必跳执行全览） */
export function CommitmentQuickActions({
  id,
  status,
}: {
  id: string;
  status: "pending" | "in_progress" | "completed" | "overdue";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [nudged, setNudged] = useState(false);
  const [err, setErr] = useState("");

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/execution/commitment", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...body }),
      });
      const j = (await r.json()) as { error?: string; nudged?: boolean };
      if (!r.ok) throw new Error(j.error ?? "操作失败");
      if (j.nudged) {
        setNudged(true);
        window.setTimeout(() => setNudged(false), 3000);
      } else {
        router.refresh();
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "操作失败");
      window.setTimeout(() => setErr(""), 3000);
    } finally {
      setBusy(false);
    }
  }

  if (status === "completed") return null;

  return (
    <span className="flex flex-shrink-0 items-center gap-2 text-xs">
      {err ? <span className="text-[var(--signal-red-text)]">{err}</span> : null}
      {nudged ? (
        <span className="text-[var(--signal-green-text)]">已催办 ✓</span>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => void patch({ nudge: true })}
          className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:underline disabled:opacity-50"
        >
          催办
        </button>
      )}
      <button
        type="button"
        disabled={busy}
        onClick={() => void patch({ status: "completed" })}
        className="text-[var(--signal-green-text)] hover:underline disabled:opacity-50"
      >
        标记完成
      </button>
    </span>
  );
}
