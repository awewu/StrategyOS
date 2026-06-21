"use client";

import { useCallback, useRef, useState } from "react";
import { FeedbackLoopPanel } from "@/components/decode/FeedbackLoopPanel";
import { StratSimPanel } from "@/components/decode/StratSimPanel";
import { BscEditor } from "@/components/decode/BscEditor";
import { HoshinEditor } from "@/components/decode/HoshinEditor";
import type { BscDimensionRow } from "@/lib/decode/bsc-map";
import type { HoshinRowPayload } from "@/lib/decode/data-access";
import type { FeedbackLoop } from "@/lib/types/stratos";

type Tab = "bsc" | "hoshin" | "stratsim";

type Initial = {
  bsc: BscDimensionRow[];
  hoshinFlat: HoshinRowPayload[];
  loops: FeedbackLoop[];
  source: "database" | "demo";
};

export function DecodeWorkspace({
  initial,
  initialTab,
}: {
  initial: Initial;
  initialTab?: Tab;
}) {
  const [tab, setTab] = useState<Tab>(initialTab ?? "bsc");
  const [bscRows, setBscRows] = useState(initial.bsc);
  const [hoshinRows, setHoshinRows] = useState(initial.hoshinFlat);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [source, setSource] = useState(initial.source);
  const fileRef = useRef<HTMLInputElement>(null);
  const [importKind, setImportKind] = useState<"combined" | "bsc" | "hoshin">("combined");

  const snapshot = useRef({ bsc: initial.bsc, hoshin: initial.hoshinFlat });

  const flash = useCallback((tone: "ok" | "err", text: string) => {
    setMsg({ tone, text });
    window.setTimeout(() => setMsg(null), 4000);
  }, []);

  async function reload() {
    const [bscRes, hoshinRes] = await Promise.all([
      fetch("/api/decode/bsc"),
      fetch("/api/decode/hoshin"),
    ]);
    if (bscRes.ok) {
      const j = (await bscRes.json()) as { rows: BscDimensionRow[]; source: "database" | "demo" };
      setBscRows(j.rows);
      snapshot.current.bsc = j.rows;
      if (j.source === "database") setSource("database");
    }
    if (hoshinRes.ok) {
      const j = (await hoshinRes.json()) as { rows: HoshinRowPayload[]; source: "database" | "demo" };
      setHoshinRows(j.rows);
      snapshot.current.hoshin = j.rows;
      if (j.source === "database") setSource("database");
    }
  }

  async function saveCurrentTab() {
    setBusy(true);
    try {
      if (tab === "bsc") {
        const res = await fetch("/api/decode/bsc", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows: bscRows }),
        });
        const j = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(j.error ?? "保存失败");
        snapshot.current.bsc = bscRows;
        setSource("database");
        flash("ok", "BSC 战略地图已保存");
      } else if (tab === "hoshin") {
        const res = await fetch("/api/decode/hoshin", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows: hoshinRows }),
        });
        const j = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(j.error ?? "保存失败");
        snapshot.current.hoshin = hoshinRows;
        setSource("database");
        flash("ok", "X-Matrix 已保存");
      }
      setEditing(false);
    } catch (e) {
      flash("err", e instanceof Error ? e.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }

  function cancelEdit() {
    setBscRows(snapshot.current.bsc);
    setHoshinRows(snapshot.current.hoshin);
    setEditing(false);
  }

  async function onImportFile(file: File) {
    setBusy(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("kind", importKind);
      const res = await fetch("/api/decode/import", { method: "POST", body: fd });
      const j = (await res.json()) as { error?: string; bsc?: number; hoshin?: number };
      if (!res.ok) throw new Error(j.error ?? "导入失败");
      await reload();
      const parts: string[] = [];
      if (j.bsc != null) parts.push(`BSC ${j.bsc} 行`);
      if (j.hoshin != null) parts.push(`X-Matrix ${j.hoshin} 行`);
      flash("ok", `导入成功：${parts.join(" · ")}`);
      if (j.bsc != null) setTab("bsc");
      else if (j.hoshin != null) setTab("hoshin");
    } catch (e) {
      flash("err", e instanceof Error ? e.message : "导入失败");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const canEdit = tab === "bsc" || tab === "hoshin";

  return (
    <div className="space-y-4">
      {msg && (
        <p
          className={`rounded-lg px-4 py-2 text-sm ${
            msg.tone === "ok"
              ? "bg-[var(--signal-green)]/10 text-[var(--signal-green)]"
              : "bg-[var(--signal-red)]/10 text-[var(--signal-red)]"
          }`}
          role="status"
        >
          {msg.text}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-panel)] px-4 py-3">
        <span className="text-xs text-[var(--color-text-muted)]">
          数据源 {source === "database" ? "DB" : "Demo"} · 支持在线录入与 Excel 导入
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {canEdit && !editing && (
            <button
              type="button"
              className="rounded-lg border border-[var(--surface-border)] px-3 py-1.5 text-sm hover:bg-black/[0.03]"
              onClick={() => setEditing(true)}
            >
              编辑
            </button>
          )}
          {canEdit && editing && (
            <>
              <button
                type="button"
                disabled={busy}
                className="rounded-lg bg-[var(--color-accent-gold)] px-3 py-1.5 text-sm text-white hover:opacity-90 disabled:opacity-50"
                onClick={() => void saveCurrentTab()}
              >
                保存
              </button>
              <button
                type="button"
                disabled={busy}
                className="rounded-lg border border-[var(--surface-border)] px-3 py-1.5 text-sm hover:bg-black/[0.03]"
                onClick={cancelEdit}
              >
                取消
              </button>
            </>
          )}
          <a
            href={`/api/decode/template?type=${tab === "hoshin" ? "hoshin" : tab === "bsc" ? "bsc" : "combined"}`}
            className="rounded-lg border border-[var(--surface-border)] px-3 py-1.5 text-sm text-[var(--color-accent-gold)] hover:bg-black/[0.03]"
          >
            下载模板
          </a>
          <select
            className="rounded-lg border border-[var(--surface-border)] px-2 py-1.5 text-xs"
            value={importKind}
            onChange={(e) => setImportKind(e.target.value as typeof importKind)}
            aria-label="导入范围"
          >
            <option value="combined">导入：BSC + X-Matrix</option>
            <option value="bsc">仅 BSC</option>
            <option value="hoshin">仅 X-Matrix</option>
          </select>
          <button
            type="button"
            disabled={busy}
            className="rounded-lg border border-[var(--color-accent-gold)]/40 px-3 py-1.5 text-sm text-[var(--color-accent-gold)] hover:bg-[var(--color-accent-gold)]/5 disabled:opacity-50"
            onClick={() => fileRef.current?.click()}
          >
            Excel 导入
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onImportFile(f);
            }}
          />
        </div>
      </div>

      <div className="flex gap-2 border-b border-black/10">
        <TabBtn active={tab === "bsc"} onClick={() => { setEditing(false); setTab("bsc"); }}>
          BSC 战略地图
        </TabBtn>
        <TabBtn active={tab === "hoshin"} onClick={() => { setEditing(false); setTab("hoshin"); }}>
          Hoshin X-Matrix
        </TabBtn>
        <TabBtn active={tab === "stratsim"} onClick={() => { setEditing(false); setTab("stratsim"); }}>
          反馈环 · StratSim
        </TabBtn>
      </div>

      {tab === "bsc" && <BscEditor rows={bscRows} editing={editing} onChange={setBscRows} />}
      {tab === "hoshin" && (
        <HoshinEditor rows={hoshinRows} editing={editing} onChange={setHoshinRows} />
      )}
      {tab === "stratsim" && (
        <div className="space-y-6">
          <FeedbackLoopPanel loops={initial.loops} />
          <StratSimPanel loops={initial.loops} />
        </div>
      )}
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-b-2 px-4 py-2 text-sm ${
        active
          ? "border-[var(--color-accent-gold)] text-[var(--color-accent-gold)]"
          : "border-transparent text-[var(--color-text-muted)]"
      }`}
    >
      {children}
    </button>
  );
}
