"use client";

import { useMemo, useState } from "react";
import {
  DEFAULT_SIM_PARAMS,
  runStratSim,
  simWarnings,
  type SimParams,
  type SimSnapshot,
} from "@/lib/stratos/strat-sim";
import { runStratSimDynamics } from "@/lib/stratos/strat-sim-dynamics";
import type { FeedbackLoop } from "@/lib/types/stratos";

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block text-sm">
      <div className="mb-1 flex justify-between text-xs text-[var(--color-text-muted)]">
        <span>{label}</span>
        <span className="font-data">{step < 1 ? value.toFixed(2) : value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-[var(--color-accent-gold)]"
      />
    </label>
  );
}

export function StratSimPanel({ loops }: { loops: FeedbackLoop[] }) {
  const [params, setParams] = useState<SimParams>(DEFAULT_SIM_PARAMS);
  const [horizon, setHorizon] = useState(8);
  const [mode, setMode] = useState<"discrete" | "dynamics">("dynamics");

  const trail = useMemo((): SimSnapshot[] => {
    if (mode === "dynamics") {
      return runStratSimDynamics(horizon, params);
    }
    return runStratSim(horizon, params);
  }, [horizon, params, mode]);
  const warnings = useMemo(() => simWarnings(trail), [trail]);
  const maxProfit = Math.max(...trail.map((t) => t.profit), 1);

  function patch(p: Partial<SimParams>) {
    setParams((prev) => ({ ...prev, ...p }));
  }

  return (
    <section className="rounded-lg border border-sky-500/30 bg-[var(--color-bg-surface)] p-6">
      <h2 className="mb-1 text-sm font-medium text-sky-400">StratSim · 反馈环推演</h2>
      <p className="mb-4 text-xs text-[var(--color-text-muted)]">
        R 增强环 · B 调节环 · D 延迟环 — {mode === "dynamics" ? "系统动力学 stock/flow" : "离散季度"} · 联动 FPA runway
      </p>

      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setMode("dynamics")}
          className={`rounded px-3 py-1 text-xs ${mode === "dynamics" ? "bg-sky-500/20 text-sky-300" : "bg-black/[0.04]"}`}
        >
          系统动力学
        </button>
        <button
          type="button"
          onClick={() => setMode("discrete")}
          className={`rounded px-3 py-1 text-xs ${mode === "discrete" ? "bg-sky-500/20 text-sky-300" : "bg-black/[0.04]"}`}
        >
          离散 MVP
        </button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Slider
          label="R 增强环强度"
          value={params.reinforceStrength}
          min={0}
          max={1}
          step={0.05}
          onChange={(v) => patch({ reinforceStrength: v })}
        />
        <Slider
          label="B 调节环强度"
          value={params.balanceStrength}
          min={0}
          max={1}
          step={0.05}
          onChange={(v) => patch({ balanceStrength: v })}
        />
        <Slider
          label="降价力度"
          value={params.priceCut}
          min={0}
          max={0.5}
          step={0.05}
          onChange={(v) => patch({ priceCut: v })}
        />
        <Slider
          label="渠道培训投入"
          value={params.training}
          min={0}
          max={1}
          step={0.05}
          onChange={(v) => patch({ training: v })}
        />
        <Slider
          label="D 延迟（季度）"
          value={params.delayQuarters}
          min={1}
          max={4}
          step={1}
          onChange={(v) => patch({ delayQuarters: v })}
        />
        <Slider
          label="推演 horizon"
          value={horizon}
          min={4}
          max={12}
          step={1}
          onChange={setHorizon}
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {loops.map((l) => (
          <span
            key={l.id}
            className="rounded border border-black/10 px-2 py-1 text-[10px] text-[var(--color-text-muted)]"
          >
            {l.kind}: {l.label}
          </span>
        ))}
      </div>

      <div className="mb-6 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-xs text-[var(--color-text-muted)]">
            <tr>
              <th className="pb-2">季度</th>
              <th className="pb-2">签约</th>
              <th className="pb-2">口碑</th>
              <th className="pb-2">利润</th>
              <th className="pb-2">投入</th>
              <th className="pb-2">中标率</th>
              <th className="pb-2">Runway</th>
              <th className="pb-2">环注记</th>
            </tr>
          </thead>
          <tbody>
            {trail.map((row) => (
              <tr key={row.quarter} className="border-t border-black/[0.06]">
                <td className="py-2 font-data text-[var(--color-accent-gold)]">{row.quarter}</td>
                <td className="py-2 font-data">{row.signings}</td>
                <td className="py-2 font-data">{row.reputation}</td>
                <td className="py-2 font-data">{row.profit}</td>
                <td className="py-2 font-data">{row.investment}</td>
                <td className="py-2 font-data">{row.winRate}%</td>
                <td
                  className={`py-2 font-data ${row.runwayMonths < 3 ? "text-[#8b0e04]" : ""}`}
                >
                  {row.runwayMonths}月
                </td>
                <td className="py-2 text-[10px] text-[var(--color-text-muted)]">
                  {row.notes.join(" · ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mb-4">
        <div className="mb-2 text-xs text-[var(--color-text-muted)]">利润趋势（万元）</div>
        <div className="flex h-24 items-end gap-1">
          {trail.map((row) => (
            <div key={row.quarter} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-[var(--color-accent-gold)]/60"
                style={{ height: `${Math.max(8, (row.profit / maxProfit) * 100)}%` }}
                title={`${row.quarter}: ${row.profit}`}
              />
              <span className="text-[9px] text-[var(--color-text-muted)]">{row.quarter.slice(-2)}</span>
            </div>
          ))}
        </div>
      </div>

      {warnings.length > 0 && (
        <ul className="space-y-1 rounded border border-[#8b0e04]/30 bg-[#8b0e04]/10 p-3 text-sm text-[#8b0e04]">
          {warnings.map((w) => (
            <li key={w}>⚠ {w}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
