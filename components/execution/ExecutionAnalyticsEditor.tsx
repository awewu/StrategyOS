"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { HorizonBubble } from "@/components/execution/HorizonBubbleChart";
import type { RiceItem, TrlRadarPoint } from "@/lib/types/stratos";

export function ExecutionAnalyticsEditor({
  initialHorizon,
  initialRice,
  initialTrl,
  source,
}: {
  initialHorizon: HorizonBubble[];
  initialRice: RiceItem[];
  initialTrl: TrlRadarPoint[];
  source: "database" | "demo";
}) {
  const router = useRouter();
  const [horizon, setHorizon] = useState(initialHorizon);
  const [rice, setRice] = useState(initialRice);
  const [trl, setTrl] = useState(initialTrl);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/fpa/execution-analytics", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ horizonBubbles: horizon, riceItems: rice, trlRadar: trl }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "保存失败");
      setEditing(false);
      setMsg("执行分析已保存");
      router.refresh();
      window.setTimeout(() => setMsg(null), 3500);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="stratos-card space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
            Horizon · RICE · TRL 分析
          </h2>
          <p className="mt-1 text-caption">
            数据源 {source === "database" ? "DB" : "Demo"} · 三层面气泡 / 优先级 / 技术成熟度
          </p>
        </div>
        <div className="flex items-center gap-2">
          {msg ? <span className="text-xs text-[var(--signal-green)]">{msg}</span> : null}
          {editing ? (
            <>
              <button
                type="button"
                className="rounded-lg border border-[var(--surface-border)] px-3 py-1.5 text-xs"
                onClick={() => {
                  setHorizon(initialHorizon);
                  setRice(initialRice);
                  setTrl(initialTrl);
                  setEditing(false);
                }}
              >
                取消
              </button>
              <button
                type="button"
                disabled={busy}
                className="rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-xs text-white disabled:opacity-50"
                onClick={() => void save()}
              >
                {busy ? "保存中…" : "保存"}
              </button>
            </>
          ) : (
            <button
              type="button"
              className="rounded-lg border border-[var(--color-accent)]/40 px-3 py-1.5 text-xs text-[var(--color-accent)]"
              onClick={() => setEditing(true)}
            >
              编辑分析
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <label className="block text-caption">
            Horizon JSON
            <textarea
              className="mt-1 w-full rounded-lg border border-[var(--surface-border)] bg-transparent p-2 font-mono text-xs"
              rows={8}
              value={JSON.stringify(horizon, null, 2)}
              onChange={(e) => {
                try {
                  setHorizon(JSON.parse(e.target.value) as HorizonBubble[]);
                } catch {
                  /* ignore parse while typing */
                }
              }}
            />
          </label>
          <label className="block text-caption">
            RICE JSON
            <textarea
              className="mt-1 w-full rounded-lg border border-[var(--surface-border)] bg-transparent p-2 font-mono text-xs"
              rows={8}
              value={JSON.stringify(rice, null, 2)}
              onChange={(e) => {
                try {
                  setRice(JSON.parse(e.target.value) as RiceItem[]);
                } catch {
                  /* ignore */
                }
              }}
            />
          </label>
          <label className="block text-caption">
            TRL JSON
            <textarea
              className="mt-1 w-full rounded-lg border border-[var(--surface-border)] bg-transparent p-2 font-mono text-xs"
              rows={8}
              value={JSON.stringify(trl, null, 2)}
              onChange={(e) => {
                try {
                  setTrl(JSON.parse(e.target.value) as TrlRadarPoint[]);
                } catch {
                  /* ignore */
                }
              }}
            />
          </label>
        </div>
      ) : (
        <p className="text-caption">
          {horizon.length} 个 Horizon 项目 · {rice.length} 条 RICE · {trl.length} 个 TRL 域
        </p>
      )}
    </section>
  );
}
