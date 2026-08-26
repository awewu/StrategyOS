"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ManagementReportPanel } from "@/components/finance/ManagementReportPanel";
import type { ManagementReportBundle } from "@/lib/fpa/management-types";
import type { MarginBridgeItem } from "@/lib/fpa/management-types";

export function ManagementReportEditor({
  report,
  bridgeSource,
}: {
  report: ManagementReportBundle;
  bridgeSource: "database" | "derived";
}) {
  const router = useRouter();
  const [bridge, setBridge] = useState(report.marginBridge);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function patchBridge(index: number, field: keyof MarginBridgeItem, value: string | number) {
    setBridge((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  }

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/fpa/management-report", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marginBridge: bridge }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "保存失败");
      setEditing(false);
      setMsg("利润桥已保存");
      router.refresh();
      window.setTimeout(() => setMsg(null), 3500);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }

  async function resetBridge() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/fpa/management-report", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset: "marginBridge" }),
      });
      if (!res.ok) throw new Error("重置失败");
      setEditing(false);
      setMsg("已恢复 FPA 推导利润桥");
      router.refresh();
      window.setTimeout(() => setMsg(null), 3500);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "重置失败");
    } finally {
      setBusy(false);
    }
  }

  const displayReport = { ...report, marginBridge: bridge };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <span className="text-caption">
          利润桥 {bridgeSource === "database" ? "· 已自定义" : "· FPA 推导"}
        </span>
        {msg ? <span className="text-xs text-[var(--signal-green-text)]">{msg}</span> : null}
        {editing ? (
          <>
            <button type="button" className="stratos-btn stratos-btn--ghost px-3 py-1.5 text-xs" onClick={() => { setBridge(report.marginBridge); setEditing(false); }}>
              取消
            </button>
            <button type="button" disabled={busy} className="stratos-btn stratos-btn--primary px-3 py-1.5 text-xs" onClick={() => void save()}>
              {busy ? "保存中…" : "保存利润桥"}
            </button>
          </>
        ) : (
          <>
            <button type="button" className="stratos-btn stratos-btn--ghost px-3 py-1.5 text-xs" onClick={() => setEditing(true)}>
              编辑利润桥
            </button>
            {bridgeSource === "database" ? (
              <button type="button" disabled={busy} className="stratos-btn stratos-btn--ghost px-3 py-1.5 text-xs" onClick={() => void resetBridge()}>
                恢复推导
              </button>
            ) : null}
          </>
        )}
      </div>

      {editing ? (
        <div className="stratos-card space-y-2 p-4">
          {bridge.map((item, i) => (
            <div key={`${item.label}-${i}`} className="grid gap-2 sm:grid-cols-3 text-sm">
              <input
                className="rounded border border-[var(--surface-border)] px-2 py-1"
                value={item.label}
                onChange={(e) => patchBridge(i, "label", e.target.value)}
              />
              <input
                type="number"
                className="rounded border border-[var(--surface-border)] px-2 py-1 font-data"
                value={item.value}
                onChange={(e) => patchBridge(i, "value", Number(e.target.value))}
              />
              <input
                type="number"
                className="rounded border border-[var(--surface-border)] px-2 py-1 font-data"
                value={item.cumulative}
                onChange={(e) => patchBridge(i, "cumulative", Number(e.target.value))}
              />
            </div>
          ))}
        </div>
      ) : null}

      <ManagementReportPanel report={displayReport} />
    </div>
  );
}
