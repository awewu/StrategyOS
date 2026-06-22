"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DecisionsPanel } from "@/components/ui/DecisionsPanel";
import type { DecisionItem } from "@/lib/panorama/scr";

const STATUS_OPTS: DecisionItem["status"][] = ["open", "pending", "closed"];

export function DecisionsEditor({
  initialDecisions,
  derivedDecisions,
  source,
}: {
  initialDecisions: DecisionItem[];
  derivedDecisions: DecisionItem[];
  source: "database" | "derived";
}) {
  const router = useRouter();
  const [decisions, setDecisions] = useState(initialDecisions);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function patch(index: number, field: keyof DecisionItem, value: string) {
    setDecisions((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [field]: value } : d)),
    );
  }

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/command/decisions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decisions }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "保存失败");
      setEditing(false);
      setMsg("待决事项已保存");
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
        body: JSON.stringify({ reset: true }),
      });
      if (!res.ok) throw new Error("重置失败");
      setDecisions(derivedDecisions);
      setEditing(false);
      setMsg("已恢复自动推导待决事项");
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
        <span className="text-xs text-[var(--color-text-muted)]">
          待决事项 {source === "database" ? "· 已自定义" : "· 指挥舱推导"}
        </span>
        {msg ? <span className="text-xs text-[var(--signal-green)]">{msg}</span> : null}
        {editing ? (
          <>
            <button type="button" className="stratos-btn stratos-btn--ghost px-3 py-1.5 text-xs" onClick={() => { setDecisions(initialDecisions); setEditing(false); }}>
              取消
            </button>
            <button type="button" disabled={busy} className="stratos-btn stratos-btn--primary px-3 py-1.5 text-xs" onClick={() => void save()}>
              {busy ? "保存中…" : "保存"}
            </button>
          </>
        ) : (
          <>
            <button type="button" className="stratos-btn stratos-btn--ghost px-3 py-1.5 text-xs" onClick={() => setEditing(true)}>
              编辑待决事项
            </button>
            {source === "database" ? (
              <button type="button" disabled={busy} className="stratos-btn stratos-btn--ghost px-3 py-1.5 text-xs" onClick={() => void resetDerived()}>
                恢复推导
              </button>
            ) : null}
          </>
        )}
      </div>

      {editing ? (
        <div className="stratos-card space-y-3 p-4">
          {decisions.map((d, i) => (
            <div key={d.id} className="grid gap-2 rounded-lg border border-[var(--surface-border)] p-3 sm:grid-cols-2 lg:grid-cols-4">
              <input className="rounded border px-2 py-1 text-xs sm:col-span-2" value={d.title} onChange={(e) => patch(i, "title", e.target.value)} placeholder="标题" />
              <input className="rounded border px-2 py-1 text-xs" value={d.owner ?? ""} onChange={(e) => patch(i, "owner", e.target.value)} placeholder="负责人" />
              <input className="rounded border px-2 py-1 text-xs" value={d.deadline ?? ""} onChange={(e) => patch(i, "deadline", e.target.value)} placeholder="期限" />
              <select className="rounded border px-2 py-1 text-xs" value={d.status} onChange={(e) => patch(i, "status", e.target.value)}>
                {STATUS_OPTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      ) : (
        <DecisionsPanel decisions={decisions} />
      )}
    </div>
  );
}
