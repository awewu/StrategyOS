"use client";

import { useState } from "react";
import { CynefinBadge } from "@/components/ui/CynefinBadge";
import type { Project } from "@/lib/types/stratos";

export function VxBoardEditor({
  initialProjects,
  source,
}: {
  initialProjects: Project[];
  source: "database" | "demo";
}) {
  const [projects, setProjects] = useState(initialProjects);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    try {
      const res = await fetch("/api/stacks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projects }),
      });
      const j = (await res.json()) as { projects?: Project[]; error?: string };
      if (!res.ok) throw new Error(j.error ?? "保存失败");
      if (j.projects) setProjects(j.projects);
      setEditing(false);
      setMsg("Vx 项目已保存");
      window.setTimeout(() => setMsg(null), 3500);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }

  function patch(i: number, patch: Partial<Project>) {
    setProjects((prev) => prev.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  }

  return (
    <section className="overflow-x-auto rounded-lg border border-[var(--surface-border)]">
      <div className="flex items-center justify-between border-b border-[var(--surface-border)] bg-[var(--surface-panel)] px-4 py-2">
        <span className="text-xs text-[var(--color-text-muted)]">
          Vx 看板 · 数据源 {source === "database" ? "DB" : "Demo"}
        </span>
        <div className="flex items-center gap-2">
          {msg ? <span className="text-xs text-[var(--color-accent)]">{msg}</span> : null}
          {editing ? (
            <>
              <button type="button" onClick={() => setEditing(false)} className="text-xs">
                取消
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void save()}
                className="rounded bg-[var(--color-accent)] px-2 py-1 text-xs text-white"
              >
                保存 Vx
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setEditing(true)} className="text-xs text-[var(--color-accent)]">
              编辑 Vx
            </button>
          )}
        </div>
      </div>
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-[var(--surface-border)] bg-[var(--surface-panel)] text-[var(--color-text-muted)]">
          <tr>
            <th className="px-4 py-3">Vx</th>
            <th className="px-4 py-3">进度</th>
            <th className="px-4 py-3">预算</th>
            <th className="px-4 py-3">域</th>
            <th className="px-4 py-3">层面</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((vx, i) => {
            const budgetPct = vx.budgetTotal
              ? Math.round((vx.budgetSpent / vx.budgetTotal) * 100)
              : 0;
            return (
              <tr key={vx.id} className="border-b border-[var(--surface-border)]">
                <td className="px-4 py-3">
                  {editing ? (
                    <div className="space-y-1">
                      <input
                        className="w-16 rounded border border-[var(--surface-border)] px-1 font-data text-xs"
                        value={vx.code}
                        onChange={(e) => patch(i, { code: e.target.value })}
                      />
                      <input
                        className="w-full rounded border border-[var(--surface-border)] px-2 py-1 text-xs"
                        value={vx.name}
                        onChange={(e) => patch(i, { name: e.target.value })}
                      />
                    </div>
                  ) : (
                    <>
                      <div className="font-medium">{vx.code}</div>
                      <div className="text-xs text-[var(--color-text-muted)]">{vx.name}</div>
                    </>
                  )}
                </td>
                <td className="px-4 py-3">
                  {editing ? (
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className="w-16 rounded border border-[var(--surface-border)] px-1 font-data text-xs"
                      value={vx.progressPercent}
                      onChange={(e) => patch(i, { progressPercent: Number(e.target.value) })}
                    />
                  ) : (
                    <>
                      <div className="font-data">{vx.progressPercent}%</div>
                      <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-black/[0.06]">
                        <div
                          className={`h-full ${vx.riskLevel === "high" ? "bg-[#8b0e04]" : "bg-[#1f8a45]"}`}
                          style={{ width: `${vx.progressPercent}%` }}
                        />
                      </div>
                    </>
                  )}
                </td>
                <td className="px-4 py-3 font-data text-xs">
                  {editing ? (
                    <div className="flex gap-1">
                      <input
                        type="number"
                        className="w-14 rounded border border-[var(--surface-border)] px-1"
                        value={vx.budgetSpent}
                        onChange={(e) => patch(i, { budgetSpent: Number(e.target.value) })}
                      />
                      /
                      <input
                        type="number"
                        className="w-14 rounded border border-[var(--surface-border)] px-1"
                        value={vx.budgetTotal}
                        onChange={(e) => patch(i, { budgetTotal: Number(e.target.value) })}
                      />
                    </div>
                  ) : (
                    <>
                      {vx.budgetSpent}/{vx.budgetTotal} 万 ({budgetPct}%)
                    </>
                  )}
                </td>
                <td className="px-4 py-3">
                  {editing ? (
                    <select
                      className="rounded border border-[var(--surface-border)] px-1 text-xs"
                      value={vx.cynefinDomain}
                      onChange={(e) =>
                        patch(i, { cynefinDomain: e.target.value as Project["cynefinDomain"] })
                      }
                    >
                      {(["clear", "complicated", "complex", "chaotic"] as const).map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <CynefinBadge domain={vx.cynefinDomain} />
                  )}
                </td>
                <td className="px-4 py-3 font-data text-xs">{vx.horizon ?? "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
