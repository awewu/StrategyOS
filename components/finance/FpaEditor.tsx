"use client";

import { useState } from "react";
import type { FpaSummary } from "@/lib/types/stratos";

function EditableRow({
  label,
  budget,
  actual,
  forecast,
  editing,
  onChange,
}: {
  label: string;
  budget: number;
  actual: number;
  forecast: number;
  editing: boolean;
  onChange: (field: "budget" | "actual" | "forecast", value: number) => void;
}) {
  if (!editing) {
    const max = Math.max(Math.abs(budget), Math.abs(actual), Math.abs(forecast), 1);
    const w = (v: number) => `${Math.round((Math.abs(v) / max) * 100)}%`;
    const fmt = (v: number) => v.toLocaleString("zh-CN");
    const bars = [
      { key: "B", value: budget, color: "var(--chart-baf-budget)" },
      { key: "A", value: actual, color: "var(--chart-baf-actual)" },
      { key: "F", value: forecast, color: "var(--chart-baf-forecast)" },
    ];
    return (
      <div className="space-y-1.5">
        <div className="text-xs font-medium text-[var(--color-text-secondary)]">{label}</div>
        {bars.map(({ key, value, color }) => (
          <div key={key} className="flex items-center gap-2">
            <span className="w-4 shrink-0 text-right font-data text-caption">{key}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/[0.04]">
              <div className="h-full rounded-full" style={{ width: w(value), background: color }} />
            </div>
            <span className="w-16 shrink-0 text-right font-data text-xs">{fmt(value)} 万</span>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-1">
      <div className="text-xs font-medium text-[var(--color-text-secondary)]">{label}</div>
      <div className="grid grid-cols-3 gap-2">
        {(["budget", "actual", "forecast"] as const).map((field, idx) => {
          const val = field === "budget" ? budget : field === "actual" ? actual : forecast;
          const keyLabel = ["B", "A", "F"][idx];
          return (
            <label key={field} className="text-xs">
              <span className="text-[var(--color-text-muted)]">{keyLabel}</span>
              <input
                type="number"
                className="mt-0.5 w-full rounded border border-[var(--surface-border)] px-2 py-1 font-data text-xs"
                value={val}
                onChange={(e) => onChange(field, Number(e.target.value))}
              />
            </label>
          );
        })}
      </div>
    </div>
  );
}

export function FpaEditor({ initial, source }: { initial: FpaSummary; source: "database" | "demo" }) {
  const [fpa, setFpa] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    try {
      const res = await fetch("/api/fpa/period", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fpa }),
      });
      const j = (await res.json()) as { fpa?: FpaSummary; error?: string };
      if (!res.ok) throw new Error(j.error ?? "保存失败");
      if (j.fpa) setFpa(j.fpa);
      setEditing(false);
      setMsg("FPA 已保存");
      window.setTimeout(() => setMsg(null), 3500);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }

  function patchRevenue(field: "budget" | "actual" | "forecast", value: number) {
    const key = field === "budget" ? "revenueBudget" : field === "actual" ? "revenueActual" : "revenueForecast";
    setFpa((prev) => ({ ...prev, [key]: value }));
  }

  function patchProfit(field: "budget" | "actual" | "forecast", value: number) {
    const key = field === "budget" ? "profitBudget" : field === "actual" ? "profitActual" : "profitForecast";
    setFpa((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <section className="space-y-5 rounded-lg border border-[var(--surface-border)] bg-[var(--surface-panel)] p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">B·A·F 三段对比</h3>
          <p className="text-caption">数据源 {source === "database" ? "DB" : "Demo"}</p>
        </div>
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
                保存
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setEditing(true)} className="text-xs text-[var(--color-accent)]">
              编辑 B-A-F
            </button>
          )}
          <span
            className={`font-data text-sm ${fpa.cashRunwayMonths < 3 ? "text-[var(--signal-red-text)]" : "text-[var(--signal-green-text)]"}`}
          >
            runway {editing ? (
              <input
                type="number"
                step="0.1"
                className="ml-1 w-14 rounded border border-[var(--surface-border)] px-1 font-data text-sm"
                value={fpa.cashRunwayMonths}
                onChange={(e) => setFpa((p) => ({ ...p, cashRunwayMonths: Number(e.target.value) }))}
              />
            ) : (
              `${fpa.cashRunwayMonths} 月`
            )}
          </span>
        </div>
      </div>
      <EditableRow
        label="营收"
        budget={fpa.revenueBudget}
        actual={fpa.revenueActual}
        forecast={fpa.revenueForecast}
        editing={editing}
        onChange={patchRevenue}
      />
      <EditableRow
        label="利润"
        budget={fpa.profitBudget}
        actual={fpa.profitActual}
        forecast={fpa.profitForecast}
        editing={editing}
        onChange={patchProfit}
      />
    </section>
  );
}
