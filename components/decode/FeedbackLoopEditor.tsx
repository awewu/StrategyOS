"use client";

import { useState } from "react";
import type { FeedbackLoop, FeedbackLoopKind } from "@/lib/types/stratos";

const KIND_STYLE: Record<string, { bg: string; label: string }> = {
  R: { bg: "bg-emerald-500/20 text-emerald-400", label: "增强环 R" },
  B: { bg: "bg-amber-500/20 text-amber-400", label: "调节环 B" },
  D: { bg: "bg-sky-500/20 text-sky-400", label: "延迟 D" },
};

const KINDS: FeedbackLoopKind[] = ["R", "B", "D"];

export function FeedbackLoopEditor({
  initialLoops,
  source,
}: {
  initialLoops: FeedbackLoop[];
  source: "database" | "demo";
}) {
  const [loops, setLoops] = useState(initialLoops);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    try {
      const res = await fetch("/api/feedback/loops", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loops }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "保存失败");
      setEditing(false);
      setMsg("反馈环已保存");
      window.setTimeout(() => setMsg(null), 3500);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }

  function addLoop() {
    setLoops((prev) => [
      ...prev,
      {
        id: `fl-new-${Date.now()}`,
        kind: "R",
        label: "新反馈环",
        chain: "因 → 果 → 因",
        bscDimension: "客户",
        fpaLinked: false,
      },
    ]);
    setEditing(true);
  }

  return (
    <section className="rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium text-[var(--color-text-muted)]">系统反馈环 · R/B/D</h2>
          <p className="text-xs text-[var(--color-text-muted)]">
            BSC 关键链标注 · 数据源 {source === "database" ? "DB" : "Demo"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {msg ? <span className="text-xs text-[var(--color-accent)]">{msg}</span> : null}
          {editing ? (
            <>
              <button type="button" onClick={() => setEditing(false)} className="text-xs text-[var(--color-text-muted)]">
                取消
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void save()}
                className="rounded bg-[var(--color-accent)] px-2 py-1 text-xs text-white"
              >
                保存
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={addLoop} className="text-xs text-[var(--color-text-muted)]">
                + 新增
              </button>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-xs text-[var(--color-accent)]"
              >
                编辑
              </button>
            </>
          )}
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {loops.map((loop, i) => {
          const style = KIND_STYLE[loop.kind];
          return (
            <div key={loop.id} className="rounded border border-[var(--surface-border)] p-4">
              {editing ? (
                <div className="space-y-2">
                  <select
                    className="w-full rounded border border-[var(--surface-border)] px-2 py-1 text-xs"
                    value={loop.kind}
                    onChange={(e) =>
                      setLoops((prev) =>
                        prev.map((l, j) => (j === i ? { ...l, kind: e.target.value as FeedbackLoopKind } : l)),
                      )
                    }
                  >
                    {KINDS.map((k) => (
                      <option key={k} value={k}>
                        {KIND_STYLE[k].label}
                      </option>
                    ))}
                  </select>
                  <input
                    className="w-full rounded border border-[var(--surface-border)] px-2 py-1 text-sm"
                    value={loop.label}
                    onChange={(e) =>
                      setLoops((prev) => prev.map((l, j) => (j === i ? { ...l, label: e.target.value } : l)))
                    }
                  />
                  <input
                    className="w-full rounded border border-[var(--surface-border)] px-2 py-1 font-mono text-xs"
                    value={loop.chain}
                    onChange={(e) =>
                      setLoops((prev) => prev.map((l, j) => (j === i ? { ...l, chain: e.target.value } : l)))
                    }
                  />
                  <input
                    className="w-full rounded border border-[var(--surface-border)] px-2 py-1 text-xs"
                    value={loop.bscDimension}
                    onChange={(e) =>
                      setLoops((prev) =>
                        prev.map((l, j) => (j === i ? { ...l, bscDimension: e.target.value } : l)),
                      )
                    }
                    placeholder="BSC 维度"
                  />
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={Boolean(loop.fpaLinked)}
                      onChange={(e) =>
                        setLoops((prev) =>
                          prev.map((l, j) => (j === i ? { ...l, fpaLinked: e.target.checked } : l)),
                        )
                      }
                    />
                    ↔ FPA 联动
                  </label>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span className={`rounded px-2 py-0.5 text-[10px] font-medium ${style.bg}`}>
                      {style.label}
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)]">{loop.bscDimension}</span>
                  </div>
                  <div className="mt-2 text-sm font-medium">{loop.label}</div>
                  <p className="mt-1 font-mono text-xs text-[var(--color-text-muted)]">{loop.chain}</p>
                  {loop.fpaLinked ? (
                    <span className="mt-2 inline-block text-[10px] text-[var(--color-accent)]">↔ FPA 联动</span>
                  ) : null}
                </>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
