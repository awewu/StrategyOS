"use client";

import { useState } from "react";
import {
  COUNTERFACTUAL_PRESETS,
  type CounterfactualResult,
  type CounterfactualType,
} from "@/lib/stratos/counterfactual";

export function CounterfactualPanel() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CounterfactualResult[]>([]);
  const [customType, setCustomType] = useState<CounterfactualType>("v4_delay");
  const [magnitude, setMagnitude] = useState(2);

  async function run(type: CounterfactualType, mag: number) {
    setLoading(true);
    try {
      const res = await fetch("/api/counterfactual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, magnitude: mag }),
      });
      const data = (await res.json()) as CounterfactualResult;
      setResults((prev) => [data, ...prev.filter((r) => r.id !== data.id)].slice(0, 6));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-lg border border-violet-500/30 bg-[var(--color-bg-surface)] p-6">
      <h2 className="mb-2 text-sm font-medium text-violet-400">反事实 diff · Phase 3</h2>
      <p className="mb-4 text-xs text-[var(--color-text-muted)]">
        「如果当时选了 B 路径」— 基于 FY26 基线推演，与 StratDiff 联动
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {COUNTERFACTUAL_PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            disabled={loading}
            onClick={() => run(p.type, p.magnitude)}
            className="rounded border border-violet-500/40 px-3 py-1.5 text-xs text-violet-300 hover:bg-violet-500/10 disabled:opacity-50"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3 rounded border border-black/10 p-3">
        <label className="text-xs text-[var(--color-text-muted)]">
          类型
          <select
            value={customType}
            onChange={(e) => setCustomType(e.target.value as CounterfactualType)}
            className="mt-1 block rounded border border-black/10 bg-[var(--color-bg-deep)] px-2 py-1 text-sm"
          >
            <option value="v4_delay">V4 延迟（季）</option>
            <option value="hotel_beat">酒店超额（0–0.5）</option>
            <option value="price_cut">降价幅度（0–0.4）</option>
          </select>
        </label>
        <label className="text-xs text-[var(--color-text-muted)]">
          幅度
          <input
            type="number"
            step={0.05}
            min={0}
            max={4}
            value={magnitude}
            onChange={(e) => setMagnitude(Number(e.target.value))}
            className="mt-1 block w-24 rounded border border-black/10 bg-[var(--color-bg-deep)] px-2 py-1 text-sm"
          />
        </label>
        <button
          type="button"
          disabled={loading}
          onClick={() => run(customType, magnitude)}
          className="rounded bg-violet-600/80 px-3 py-1.5 text-xs text-white disabled:opacity-50"
        >
          运行推演
        </button>
      </div>

      <div className="space-y-3">
        {(results.length > 0
          ? results
          : COUNTERFACTUAL_PRESETS.map((p) => ({
              id: p.label,
              premise: p.label,
              impact: "点击上方按钮运行推演",
              linkedDiff: [] as CounterfactualResult["linkedDiff"],
              metrics: { revenueDeltaM: 0, runwayMonths: 0 },
            }))
        ).map((s) => (
          <div key={s.id} className="rounded border border-black/10 p-4">
            <div className="text-sm font-medium">{s.premise}</div>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">{s.impact}</p>
            {s.linkedDiff.length > 0 && (
              <span className="mt-2 inline-block font-mono text-[10px] text-violet-400/80">
                {s.linkedDiff.join(" · ")}
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
