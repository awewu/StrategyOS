"use client";

import { useState } from "react";
import { RobustTrend } from "@/components/health/RobustTrend";
import { SectionCard } from "@/components/ui/KpiTile";
import { buildRobustView, type RobustView } from "@/lib/health/robust-view";
import { pillarLabels } from "@/lib/health/twelve-dimensions";
import type { TrafficLight } from "@/lib/types/stratos";

const PILLARS = ["commitment", "values", "operations"] as const;
const SIGNALS: TrafficLight[] = ["green", "yellow", "red"];
const SIGNAL_LABEL: Record<TrafficLight, string> = { green: "绿", yellow: "黄", red: "红" };

interface EditRow {
  dimId: string;
  name: string;
  pillar: (typeof PILLARS)[number];
  score: number;
  signal: TrafficLight;
  target: number | null;
}

function toRows(view: RobustView): EditRow[] {
  return view.dims.map((d) => ({
    dimId: d.id,
    name: d.name,
    pillar: d.pillar,
    score: d.score,
    signal: d.signal,
    target: d.target,
  }));
}

/** DB-backed 12-dim StratRobust panel: read = trend view, edit = score/signal/target. */
export function TwelveDimEditor({ view, canEdit }: { view: RobustView; canEdit: boolean }) {
  const [display, setDisplay] = useState<RobustView>(view);
  const [rows, setRows] = useState<EditRow[]>(() => toRows(view));
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function patch(dimId: string, next: Partial<EditRow>) {
    setRows((prev) => prev.map((r) => (r.dimId === dimId ? { ...r, ...next } : r)));
  }

  function rebuildLocal(next: EditRow[]): RobustView {
    const current = Object.fromEntries(
      next.map((r) => [r.dimId, { score: r.score, signal: r.signal, target: r.target }]),
    );
    const prior = Object.fromEntries(
      display.dims.filter((d) => d.prior != null).map((d) => [d.id, d.prior as number]),
    );
    return buildRobustView({
      period: display.period,
      priorPeriod: display.priorPeriod,
      source: display.source,
      current,
      prior: Object.keys(prior).length ? prior : null,
    });
  }

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/health/twelve-dim", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: rows.map((r) => ({
            dimId: r.dimId,
            score: r.score,
            signal: r.signal,
            target: r.target,
            note: null,
          })),
        }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "保存失败");
      setDisplay(rebuildLocal(rows));
      setEditing(false);
      setMsg("十二维评分已保存");
      window.setTimeout(() => setMsg(null), 3500);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SectionCard
      title="十二维健康度 · 战略部下钻"
      subtitle="当期值 · 信号阈值带 · 环比上期 · 目标线（可编辑）"
      dense
      action={
        <div className="flex items-center gap-2">
          {msg ? <span className="text-caption text-[var(--color-accent)]">{msg}</span> : null}
          {canEdit && !editing ? (
            <button
              type="button"
              onClick={() => {
                setRows(toRows(display));
                setEditing(true);
              }}
              className="text-caption text-[var(--color-accent)]"
            >
              编辑
            </button>
          ) : null}
          {editing ? (
            <>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="text-caption text-[var(--color-text-muted)]"
              >
                取消
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void save()}
                className="rounded bg-[var(--color-accent)] px-2 py-1 text-caption text-white"
              >
                保存
              </button>
            </>
          ) : null}
        </div>
      }
    >
      {editing ? (
        <div className="grid gap-5 lg:grid-cols-3">
          {PILLARS.map((pillar) => (
            <div key={pillar} className="space-y-2">
              <h4 className="text-xs text-[var(--color-accent)]">{pillarLabels[pillar]}</h4>
              {rows
                .filter((r) => r.pillar === pillar)
                .map((r) => (
                  <div key={r.dimId} className="rounded border border-[var(--surface-border)] p-2">
                    <div className="mb-1 text-xs">{r.name}</div>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1 text-[11px] text-[var(--color-text-muted)]">
                        分
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={r.score}
                          onChange={(e) => patch(r.dimId, { score: Number(e.target.value) })}
                          className="w-14 rounded border border-[var(--surface-border)] px-1 py-0.5 text-xs"
                        />
                      </label>
                      <label className="flex items-center gap-1 text-[11px] text-[var(--color-text-muted)]">
                        目标
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={r.target ?? ""}
                          placeholder="未设"
                          onChange={(e) =>
                            patch(r.dimId, {
                              target: e.target.value === "" ? null : Number(e.target.value),
                            })
                          }
                          className="w-14 rounded border border-[var(--surface-border)] px-1 py-0.5 text-xs"
                        />
                      </label>
                      <select
                        value={r.signal}
                        onChange={(e) => patch(r.dimId, { signal: e.target.value as TrafficLight })}
                        className="rounded border border-[var(--surface-border)] px-1 py-0.5 text-xs"
                      >
                        {SIGNALS.map((s) => (
                          <option key={s} value={s}>
                            {SIGNAL_LABEL[s]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
            </div>
          ))}
        </div>
      ) : (
        <RobustTrend view={display} />
      )}
    </SectionCard>
  );
}
