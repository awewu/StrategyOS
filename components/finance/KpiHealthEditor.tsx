"use client";

import { useState } from "react";
import type { KpiHealthBundle, KpiHealthMetric, KpiUnit } from "@/lib/fpa/kpi-health";

const UNIT_OPTIONS: { value: KpiUnit; label: string }[] = [
  { value: "percent", label: "%" },
  { value: "currency", label: "万" },
  { value: "ratio", label: "×" },
  { value: "months", label: "月" },
  { value: "count", label: "个" },
];

const DIMENSIONS = [
  { key: "currentValue", label: "本期" },
  { key: "targetValue", label: "目标" },
  { key: "priorYearValue", label: "同期" },
  { key: "qtdValue", label: "季度" },
  { key: "ytdValue", label: "YTD" },
  { key: "fullYearValue", label: "年度" },
] as const;

type DimKey = (typeof DIMENSIONS)[number]["key"];

type Row = KpiHealthMetric;

function emptyRow(sortOrder: number): Row {
  return {
    id: `new-${Math.random().toString(36).slice(2, 9)}`,
    name: "",
    category: null,
    unit: "percent",
    currentValue: null,
    targetValue: null,
    priorYearValue: null,
    qtdValue: null,
    ytdValue: null,
    fullYearValue: null,
    higherIsBetter: true,
    sortOrder,
  };
}

function fmt(v: number | null, unit: KpiUnit): string {
  if (v === null) return "待接入";
  if (unit === "percent") return `${v}%`;
  if (unit === "currency") return `${v.toLocaleString("zh-CN")} 万`;
  if (unit === "months") return `${v} 月`;
  if (unit === "ratio") return `${v}×`;
  return String(v);
}

/** 达成信号：本期 vs 目标，考虑 higherIsBetter。 */
function attainColor(row: Row): string {
  if (row.currentValue === null || row.targetValue === null) return "var(--surface-border-strong)";
  const meets = row.higherIsBetter ? row.currentValue >= row.targetValue : row.currentValue <= row.targetValue;
  if (meets) return "var(--signal-green)";
  const gap = Math.abs(row.currentValue - row.targetValue) / (Math.abs(row.targetValue) || 1);
  return gap <= 0.1 ? "var(--signal-yellow)" : "var(--signal-red)";
}

export function KpiHealthEditor({ bundle }: { bundle: KpiHealthBundle }) {
  const [rows, setRows] = useState<Row[]>(bundle.metrics);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [source, setSource] = useState(bundle.source);

  function patch(id: string, next: Partial<Row>) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...next } : r)));
  }
  function patchNum(id: string, key: DimKey, raw: string) {
    const n = raw.trim() === "" ? null : Number(raw);
    patch(id, { [key]: n !== null && Number.isFinite(n) ? n : null } as Partial<Row>);
  }

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const clean = rows.filter((r) => r.name.trim());
      const res = await fetch("/api/fpa/kpi-health", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metrics: clean.map((r, i) => ({ ...r, sortOrder: i })) }),
      });
      const data = (await res.json()) as KpiHealthBundle & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "保存失败");
      setRows(data.metrics);
      setSource(data.source);
      setEditing(false);
      setMsg("已保存");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }

  const cellCls = "px-2.5 py-2 text-right font-data tabular-nums";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-caption">
            数据源：{source === "database" ? "数据库" : "演示（上线后录入）"}
          </span>
          {msg ? <span className="text-caption text-[var(--color-accent)]">· {msg}</span> : null}
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button
                type="button"
                className="stratos-btn stratos-btn--ghost px-3 py-1.5 text-caption"
                onClick={() => {
                  setRows(bundle.metrics);
                  setEditing(false);
                  setMsg(null);
                }}
              >
                取消
              </button>
              <button
                type="button"
                disabled={busy}
                className="stratos-btn stratos-btn--primary px-3 py-1.5 text-caption"
                onClick={() => void save()}
              >
                {busy ? "保存中…" : "保存"}
              </button>
            </>
          ) : (
            <button
              type="button"
              className="stratos-btn stratos-btn--ghost px-3 py-1.5 text-caption"
              onClick={() => setEditing(true)}
            >
              编辑
            </button>
          )}
        </div>
      </div>

      <div className="stratos-table-wrap">
        <table className="stratos-table">
          <thead>
            <tr>
              <th className="text-left">指标</th>
              {editing ? <th className="text-left">单位</th> : null}
              {DIMENSIONS.map((d) => (
                <th key={d.key} className="text-right">{d.label}</th>
              ))}
              <th className="text-center">达成</th>
              {editing ? <th /> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="text-left">
                  {editing ? (
                    <input
                      value={r.name}
                      onChange={(e) => patch(r.id, { name: e.target.value })}
                      placeholder="指标名称"
                      className="w-40 rounded border border-[var(--surface-border)] bg-transparent px-2 py-1 text-caption"
                    />
                  ) : (
                    <div>
                      <span className="text-[var(--color-text-primary)]">{r.name}</span>
                      {r.category ? (
                        <span className="ml-2 text-[var(--type-label)] text-[var(--color-text-muted)]">{r.category}</span>
                      ) : null}
                    </div>
                  )}
                </td>
                {editing ? (
                  <td className="text-left">
                    <select
                      value={r.unit}
                      onChange={(e) => patch(r.id, { unit: e.target.value as KpiUnit })}
                      className="rounded border border-[var(--surface-border)] bg-transparent px-1.5 py-1 text-caption"
                    >
                      {UNIT_OPTIONS.map((u) => (
                        <option key={u.value} value={u.value}>{u.label}</option>
                      ))}
                    </select>
                  </td>
                ) : null}
                {DIMENSIONS.map((d) => (
                  <td key={d.key} className={cellCls}>
                    {editing ? (
                      <input
                        type="number"
                        step="any"
                        value={r[d.key] ?? ""}
                        onChange={(e) => patchNum(r.id, d.key, e.target.value)}
                        placeholder="—"
                        className="w-20 rounded border border-[var(--surface-border)] bg-transparent px-2 py-1 text-right text-caption"
                      />
                    ) : r[d.key] === null ? (
                      <span className="text-[var(--color-text-muted)]">待接入</span>
                    ) : (
                      fmt(r[d.key], r.unit)
                    )}
                  </td>
                ))}
                <td className="text-center">
                  <span
                    aria-hidden
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: attainColor(r) }}
                  />
                </td>
                {editing ? (
                  <td className="text-right">
                    <button
                      type="button"
                      className="text-caption text-[var(--signal-red-text)] hover:underline"
                      onClick={() => setRows((rs) => rs.filter((x) => x.id !== r.id))}
                    >
                      删除
                    </button>
                  </td>
                ) : null}
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-2.5 py-6 text-center text-caption">
                  尚无指标 · 点「编辑」新增
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {editing ? (
        <button
          type="button"
          className="stratos-btn stratos-btn--ghost px-3 py-1.5 text-caption"
          onClick={() => setRows((rs) => [...rs, emptyRow(rs.length)])}
        >
          + 新增指标
        </button>
      ) : null}
    </div>
  );
}
