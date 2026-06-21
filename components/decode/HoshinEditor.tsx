"use client";

import type { HoshinQuadrant } from "@/lib/decode/hoshin-data";
import type { HoshinRowPayload } from "@/lib/decode/data-access";

function groupQuadrants(rows: HoshinRowPayload[]): HoshinQuadrant[] {
  const map = new Map<string, HoshinQuadrant>();
  for (const row of rows) {
    const key = `${row.rowLabel}|||${row.colLabel}`;
    if (!map.has(key)) {
      map.set(key, { rowLabel: row.rowLabel, colLabel: row.colLabel, entries: [] });
    }
    map.get(key)!.entries.push({
      id: row.id,
      label: row.label,
      tti: row.tti,
      okr: row.okr,
      action: row.action,
      owner: row.owner,
      correlated: row.correlated,
    });
  }
  return [...map.values()];
}

export function HoshinEditor({
  rows,
  editing,
  onChange,
}: {
  rows: HoshinRowPayload[];
  editing: boolean;
  onChange: (rows: HoshinRowPayload[]) => void;
}) {
  const quadrants = groupQuadrants(rows);

  function patch(i: number, patch: Partial<HoshinRowPayload>) {
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function remove(i: number) {
    onChange(rows.filter((_, idx) => idx !== i));
  }

  function addRow() {
    onChange([
      ...rows,
      {
        id: `new-${Date.now()}`,
        rowLabel: "南 · 长期突破",
        colLabel: "东 · 指标",
        label: "",
        tti: "",
        okr: "",
        action: "",
        owner: "",
        correlated: false,
      },
    ]);
  }

  return (
    <section className="space-y-6">
      <div className="rounded-lg border border-[var(--color-accent-gold)]/30 bg-[var(--color-bg-surface)] p-6">
        <h2 className="mb-2 text-sm font-medium text-[var(--color-accent-gold)]">Hoshin X-Matrix · I7</h2>
        <p className="mb-4 text-xs text-[var(--color-text-muted)]">
          南=长期突破 · 西=年度突破 · 北=改善项目 · 东=指标 · ● = correlation_dot
        </p>
        <div className="grid grid-cols-3 gap-px overflow-hidden rounded-lg bg-black/[0.06] text-sm">
          <div className="bg-[var(--color-bg-deep)] p-3" />
          <div className="bg-[var(--color-bg-deep)] p-3 text-center text-xs text-[var(--color-text-muted)]">
            东 · 指标
          </div>
          <div className="bg-[var(--color-bg-deep)] p-3 text-center text-xs text-[var(--color-text-muted)]">
            北 · Vx
          </div>
          <div className="bg-[var(--color-bg-deep)] p-3 text-xs text-[var(--color-text-muted)]">南 · 长期</div>
          <MatrixCell entries={quadrants[0]?.entries ?? []} />
          <MatrixCell entries={quadrants[1]?.entries ?? []} />
          <div className="bg-[var(--color-bg-deep)] p-3 text-xs text-[var(--color-text-muted)]">西 · 年度</div>
          <MatrixCell entries={quadrants[2]?.entries ?? []} />
          <MatrixCell entries={quadrants[3]?.entries ?? []} />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-black/10 bg-[var(--color-bg-surface)]">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-black/10 text-xs text-[var(--color-text-muted)]">
            <tr>
              <th className="p-3">行标签</th>
              <th className="p-3">列标签</th>
              <th className="p-3">条目</th>
              <th className="p-3">TTI</th>
              <th className="p-3">OKR</th>
              <th className="p-3">行动</th>
              <th className="p-3">Owner</th>
              <th className="p-3">关联</th>
              {editing && <th className="p-3 w-12" />}
            </tr>
          </thead>
          <tbody>
            {rows.map((e, i) => (
              <tr key={e.id} className="border-t border-black/[0.06]">
                {(["rowLabel", "colLabel", "label", "tti", "okr", "action", "owner"] as const).map((field) => (
                  <td key={field} className="p-2">
                    {editing ? (
                      <input
                        className="w-full min-w-[80px] rounded border border-black/10 px-2 py-1 text-xs"
                        value={e[field]}
                        onChange={(ev) => patch(i, { [field]: ev.target.value })}
                      />
                    ) : (
                      <span className={field === "label" ? "font-medium" : "text-xs"}>{e[field]}</span>
                    )}
                  </td>
                ))}
                <td className="p-2 text-center">
                  {editing ? (
                    <input
                      type="checkbox"
                      checked={Boolean(e.correlated)}
                      onChange={(ev) => patch(i, { correlated: ev.target.checked })}
                    />
                  ) : e.correlated ? (
                    <span className="inline-block h-2 w-2 rounded-full bg-[var(--color-accent-gold)]" />
                  ) : null}
                </td>
                {editing && (
                  <td className="p-2">
                    <button
                      type="button"
                      className="text-xs text-[var(--signal-red)] hover:underline"
                      onClick={() => remove(i)}
                    >
                      删
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {editing && (
          <div className="border-t border-black/10 p-3">
            <button
              type="button"
              className="rounded-lg border border-dashed border-black/15 px-3 py-2 text-xs text-[var(--color-text-muted)] hover:bg-black/[0.03]"
              onClick={addRow}
            >
              + 添加 X-Matrix 行
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function MatrixCell({ entries }: { entries: HoshinQuadrant["entries"] }) {
  return (
    <div className="relative bg-[var(--color-bg-deep)] p-3">
      {entries.map((entry) => (
        <div key={entry.id} className="text-xs">
          {entry.correlated && (
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-[var(--color-accent-gold)]" />
          )}
          {entry.label}
        </div>
      ))}
    </div>
  );
}
