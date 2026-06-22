"use client";

import { useCallback, useRef, useState } from "react";
import { FeedbackLoopEditor } from "@/components/decode/FeedbackLoopEditor";
import { StratSimPanel } from "@/components/decode/StratSimPanel";
import { BscEditor } from "@/components/decode/BscEditor";
import { HoshinEditor } from "@/components/decode/HoshinEditor";
import { StratosTabButtons } from "@/components/ui/StratosTabNav";
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

      <div className="stratos-card stratos-card--padded flex flex-wrap items-center gap-3">
        <span className="text-xs text-[var(--color-text-muted)]">
          数据源 {source === "database" ? "DB" : "Demo"} · 在线录入 / Excel 导入
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {canEdit && !editing ? (
            <button type="button" className="stratos-btn px-3 py-1.5 text-xs" onClick={() => setEditing(true)}>
              编辑
            </button>
          ) : null}
          {canEdit && editing ? (
            <>
              <button
                type="button"
                disabled={busy}
                className="stratos-btn stratos-btn--primary px-3 py-1.5 text-xs"
                onClick={() => void saveCurrentTab()}
              >
                保存
              </button>
              <button type="button" disabled={busy} className="stratos-btn px-3 py-1.5 text-xs" onClick={cancelEdit}>
                取消
              </button>
            </>
          ) : null}
          <a
            href={`/api/decode/template?type=${tab === "hoshin" ? "hoshin" : tab === "bsc" ? "bsc" : "combined"}`}
            className="stratos-btn px-3 py-1.5 text-xs"
          >
            下载模板
          </a>
          <select
            className="stratos-input w-auto px-2 py-1.5 text-xs"
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
            className="stratos-btn stratos-btn--primary px-3 py-1.5 text-xs"
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

      <StratosTabButtons
        active={tab}
        onChange={(id) => {
          setEditing(false);
          setTab(id as Tab);
        }}
        tabs={[
          { id: "bsc", label: "BSC 战略地图" },
          { id: "hoshin", label: "Hoshin X-Matrix" },
          { id: "stratsim", label: "反馈环 · StratSim" },
        ]}
      />

      {tab === "bsc" && <BscEditor rows={bscRows} editing={editing} onChange={setBscRows} />}
      {tab === "hoshin" && (
        <HoshinEditor rows={hoshinRows} editing={editing} onChange={setHoshinRows} />
      )}
      {tab === "stratsim" && (
        <div className="space-y-6">
          <FeedbackLoopEditor initialLoops={initial.loops} source={source} />
          <StratSimPanel loops={initial.loops} />
        </div>
      )}
    </div>
  );
}
