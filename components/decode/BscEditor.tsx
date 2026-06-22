"use client";

import type { BscDimensionRow } from "@/lib/decode/bsc-map";
import type { TrafficLight } from "@/lib/types/stratos";
import { TrafficLightDot } from "@/components/ui/TrafficLight";

const LIGHTS: TrafficLight[] = ["green", "yellow", "red"];

export function BscEditor({
  rows,
  editing,
  onChange,
}: {
  rows: BscDimensionRow[];
  editing: boolean;
  onChange: (rows: BscDimensionRow[]) => void;
}) {
  function patch(i: number, patch: Partial<BscDimensionRow>) {
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function patchOperating(i: number, raw: string) {
    const operating = raw
      .split(/[;；\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    patch(i, { operating });
  }

  return (
    <section className="stratos-card stratos-card--padded">
      <h2 className="text-title mb-4 text-[var(--color-text-primary)]">BSC 四维度 · Must-Win / Must-Not-Fail</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {rows.map((row, i) => (
          <div key={`${row.dim}-${i}`} className="rounded border border-[var(--surface-border)] p-4">
            {editing ? (
              <label className="block text-xs text-[var(--color-text-muted)]">
                维度
                <input
                  className="mt-1 w-full rounded border border-[var(--surface-border)] px-2 py-1 text-sm"
                  value={row.dim}
                  onChange={(e) => patch(i, { dim: e.target.value })}
                />
              </label>
            ) : (
              <div className="text-xs text-[var(--color-accent)]">{row.dim}</div>
            )}
            {editing ? (
              <label className="mt-2 block text-xs text-[var(--color-text-muted)]">
                战略目标
                <textarea
                  className="mt-1 w-full rounded border border-[var(--surface-border)] px-2 py-1 text-sm"
                  rows={2}
                  value={row.objective}
                  onChange={(e) => patch(i, { objective: e.target.value })}
                />
              </label>
            ) : (
              <div className="mt-1 font-medium">{row.objective}</div>
            )}
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex items-start justify-between gap-2 rounded bg-black/[0.03] p-2">
                <div className="min-w-0 flex-1">
                  <span className="text-[var(--color-text-muted)]">Must-Win · </span>
                  {editing ? (
                    <input
                      className="mt-1 w-full rounded border border-[var(--surface-border)] px-2 py-1"
                      value={row.mustWin}
                      onChange={(e) => patch(i, { mustWin: e.target.value })}
                    />
                  ) : (
                    row.mustWin
                  )}
                </div>
                {editing ? (
                  <select
                    className="rounded border border-[var(--surface-border)] px-1 py-0.5 text-xs"
                    value={row.mustWinStatus}
                    onChange={(e) => patch(i, { mustWinStatus: e.target.value as TrafficLight })}
                  >
                    {LIGHTS.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                ) : (
                  <TrafficLightDot signal={row.mustWinStatus} />
                )}
              </div>
              {editing ? (
                <label className="block text-[var(--color-text-muted)]">
                  运营指标（分号分隔）
                  <textarea
                    className="mt-1 w-full rounded border border-[var(--surface-border)] px-2 py-1"
                    rows={2}
                    value={row.operating.join("; ")}
                    onChange={(e) => patchOperating(i, e.target.value)}
                  />
                </label>
              ) : (
                <ul className="space-y-1 text-[var(--color-text-muted)]">
                  {row.operating.map((op) => (
                    <li key={op}>· {op}</li>
                  ))}
                </ul>
              )}
              <div className="flex items-start justify-between gap-2 rounded bg-black/[0.03] p-2">
                <div className="min-w-0 flex-1">
                  <span className="text-[var(--color-text-muted)]">Must-Not-Fail · </span>
                  {editing ? (
                    <input
                      className="mt-1 w-full rounded border border-[var(--surface-border)] px-2 py-1"
                      value={row.mustNotFail}
                      onChange={(e) => patch(i, { mustNotFail: e.target.value })}
                    />
                  ) : (
                    row.mustNotFail
                  )}
                </div>
                {editing ? (
                  <select
                    className="rounded border border-[var(--surface-border)] px-1 py-0.5 text-xs"
                    value={row.notFailStatus}
                    onChange={(e) => patch(i, { notFailStatus: e.target.value as TrafficLight })}
                  >
                    {LIGHTS.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                ) : (
                  <TrafficLightDot signal={row.notFailStatus} />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {editing && (
        <button
          type="button"
          className="mt-4 rounded-lg border border-dashed border-[var(--surface-border-strong)] px-3 py-2 text-xs text-[var(--color-text-muted)] hover:bg-black/[0.03]"
          onClick={() =>
            onChange([
              ...rows,
              {
                dim: "新维度",
                objective: "",
                mustWin: "",
                operating: [],
                mustNotFail: "",
                mustWinStatus: "yellow",
                notFailStatus: "yellow",
              },
            ])
          }
        >
          + 添加 BSC 维度行
        </button>
      )}
    </section>
  );
}
