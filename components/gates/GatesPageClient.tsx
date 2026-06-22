"use client";

import { useState } from "react";
import { GateChecklistPanel } from "@/components/gates/GateChecklistPanel";
import type { GateChecklist, GateItem, GateStatus } from "@/lib/gates/checklists";

const STATUSES: GateStatus[] = ["pass", "fail", "partial"];

export function GatesPageClient({
  initialChecklists,
  initialSummary,
  source: dataSource,
}: {
  initialChecklists: GateChecklist[];
  initialSummary: { pass: number; fail: number; partial: number };
  source: "database" | "demo";
}) {
  const [checklists, setChecklists] = useState(initialChecklists);
  const [summary, setSummary] = useState(initialSummary);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function patchItem(checklistId: string, itemId: string, patch: Partial<GateItem>) {
    setChecklists((prev) =>
      prev.map((cl) =>
        cl.id !== checklistId
          ? cl
          : {
              ...cl,
              items: cl.items.map((item) => (item.id !== itemId ? item : { ...item, ...patch })),
            },
      ),
    );
  }

  async function save() {
    setBusy(true);
    try {
      const res = await fetch("/api/gates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checklists }),
      });
      const j = (await res.json()) as { summary?: typeof summary; error?: string };
      if (!res.ok) throw new Error(j.error ?? "保存失败");
      if (j.summary) setSummary(j.summary);
      setEditing(false);
      setMsg("Gate 清单已保存");
      window.setTimeout(() => setMsg(null), 3500);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 -mt-4">
        <p className="font-data text-xs text-[var(--color-text-muted)]">
          通过 {summary.pass} · 部分 {summary.partial} · 否 {summary.fail} · 数据源{" "}
          {dataSource === "database" ? "DB" : "Demo"}
        </p>
        <div className="flex items-center gap-2">
          {msg ? <span className="text-xs text-[var(--color-accent-gold)]">{msg}</span> : null}
          {editing ? (
            <>
              <button type="button" onClick={() => setEditing(false)} className="text-xs">
                取消
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void save()}
                className="rounded bg-[var(--color-accent-gold)] px-2 py-1 text-xs text-white"
              >
                保存 Gate
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-xs text-[var(--color-accent-gold)]"
            >
              编辑门槛
            </button>
          )}
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {checklists.map((g) =>
          editing ? (
            <EditableGatePanel key={g.id} checklist={g} onPatch={patchItem} />
          ) : (
            <GateChecklistPanel key={g.id} checklist={g} />
          ),
        )}
      </div>
    </>
  );
}

function EditableGatePanel({
  checklist,
  onPatch,
}: {
  checklist: GateChecklist;
  onPatch: (checklistId: string, itemId: string, patch: Partial<GateItem>) => void;
}) {
  const risks = checklist.items.filter((i) => i.status !== "pass");
  return (
    <section className="rounded-lg border border-black/10 bg-[var(--color-bg-surface)] p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-medium">{checklist.title}</h3>
        {checklist.doctrine ? (
          <span className="text-xs text-[var(--color-accent-gold)]">{checklist.doctrine}</span>
        ) : null}
      </div>
      <ul className="space-y-2">
        {checklist.items.map((item) => (
          <li key={item.id} className="rounded border border-black/[0.06] p-3 text-sm">
            <p className="mb-2">{item.label}</p>
            <div className="flex flex-wrap gap-2">
              <select
                className="rounded border border-black/10 px-2 py-1 text-xs"
                value={item.status}
                onChange={(e) =>
                  onPatch(checklist.id, item.id, { status: e.target.value as GateStatus })
                }
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <input
                className="min-w-[160px] flex-1 rounded border border-black/10 px-2 py-1 text-xs"
                value={item.note ?? ""}
                onChange={(e) => onPatch(checklist.id, item.id, { note: e.target.value || undefined })}
                placeholder="备注 / 风险说明"
              />
            </div>
          </li>
        ))}
      </ul>
      {risks.length > 0 ? (
        <div className="mt-4 rounded border border-[var(--signal-red)]/30 bg-[var(--signal-red)]/5 px-3 py-2 text-xs">
          风险清单 {risks.length} 项
        </div>
      ) : null}
    </section>
  );
}
