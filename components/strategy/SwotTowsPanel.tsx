"use client";

import { useMemo, useState } from "react";
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer,
} from "recharts";
import {
  SWOT_CATEGORY_LABEL, TOWS_LABEL,
  type SwotCategory, type TowsSet, type TowsType,
} from "@/lib/market-intel/swot";
import { clampSwotScale } from "@/lib/strategy/swot-bridge";

export interface SwotPanelItem {
  quadrant: SwotCategory;
  content: string;
  weight?: number | null;
  intensity?: number | null;
  dimension?: string | null;
}

const CAT_COLOR: Record<SwotCategory, string> = {
  strength: "var(--signal-green)",
  weakness: "var(--signal-red)",
  opportunity: "var(--color-accent)",
  threat: "var(--signal-yellow)",
};

const CATS: SwotCategory[] = ["strength", "weakness", "opportunity", "threat"];

const TOWS_TYPES: TowsType[] = ["SO", "WO", "ST", "WT"];

export function SwotTowsPanel({ items }: { items: SwotPanelItem[] }) {
  const [tows, setTows] = useState<TowsSet | null>(null);
  const [engine, setEngine] = useState<"llm" | "rule" | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const seriesByCat = useMemo(() => {
    const map: Record<SwotCategory, Array<{ x: number; y: number; z: number; name: string }>> = {
      strength: [], weakness: [], opportunity: [], threat: [],
    };
    for (const it of items) {
      const content = it.content?.trim();
      if (!content || !map[it.quadrant]) continue;
      const x = clampSwotScale(it.weight);
      const y = clampSwotScale(it.intensity);
      map[it.quadrant].push({ x, y, z: x * y, name: content });
    }
    return map;
  }, [items]);

  const total = CATS.reduce((n, c) => n + seriesByCat[c].length, 0);

  async function generate() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/strategy/plan/swot-tows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "TOWS 生成失败");
      setTows(data.tows as TowsSet);
      setEngine(data.engine ?? null);
      setNote(data.note ?? null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "TOWS 生成失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 rounded-lg border border-[var(--surface-border)] p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">十字轴定位 · TOWS 推演</h4>
          <p className="text-caption">X = 重要性(weight) · Y = 强度/置信(intensity)，1–5。与市场模块同源同模型。</p>
        </div>
        <button
          type="button"
          onClick={generate}
          disabled={loading || total === 0}
          className="rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-sm text-white hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "推演中…" : "生成 TOWS 建议"}
        </button>
      </div>

      {total === 0 ? (
        <p className="text-caption text-[var(--color-text-muted)]">先在上方填写 SWOT 条目并设定重要性/强度，即可查看十字轴定位。</p>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" />
              <XAxis
                type="number" dataKey="x" name="重要性" domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]}
                tick={{ fontSize: 11 }} label={{ value: "重要性 →", position: "insideBottomRight", fontSize: 11 }}
              />
              <YAxis
                type="number" dataKey="y" name="强度/置信" domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]}
                tick={{ fontSize: 11 }} label={{ value: "强度 →", angle: -90, position: "insideLeft", fontSize: 11 }}
              />
              <ZAxis type="number" dataKey="z" range={[60, 320]} />
              <ReferenceLine x={3} stroke="var(--surface-border)" />
              <ReferenceLine y={3} stroke="var(--surface-border)" />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={({ payload }) => {
                  const p = payload?.[0]?.payload as { name: string; x: number; y: number } | undefined;
                  if (!p) return null;
                  return (
                    <div className="rounded border border-[var(--surface-border)] bg-white px-2 py-1 text-xs shadow">
                      <div className="font-medium">{p.name}</div>
                      <div className="text-[var(--color-text-muted)]">重要性 {p.x} · 强度 {p.y}</div>
                    </div>
                  );
                }}
              />
              {CATS.map((cat) => (
                <Scatter key={cat} name={SWOT_CATEGORY_LABEL[cat]} data={seriesByCat[cat]} fill={CAT_COLOR[cat]} />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      {err && <p className="text-caption text-[var(--signal-red-text)]">{err}</p>}

      {tows && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-caption">
            <span className="rounded bg-black/[0.05] px-1.5 py-0.5">
              {engine === "llm" ? "AI 推演" : "规则引擎兜底"}
            </span>
            {note && <span className="text-[var(--color-text-muted)]">{note}</span>}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {TOWS_TYPES.map((type) => (
              <div key={type} className="rounded border border-[var(--surface-border)] p-3">
                <div className="mb-1 text-xs font-semibold text-[var(--color-text-primary)]">{TOWS_LABEL[type]}</div>
                {tows[type].length === 0 ? (
                  <p className="text-caption text-[var(--color-text-muted)]">—</p>
                ) : (
                  <ul className="space-y-1.5">
                    {tows[type].map((r, i) => (
                      <li key={i} className="text-xs">
                        <div className="font-medium">{r.title}</div>
                        {r.rationale && <div className="text-[var(--color-text-muted)]">{r.rationale}</div>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
