"use client";

import { useState, useMemo } from "react";
import type { WorkbenchData } from "@/lib/market-intel/workbench-data";
import { CellDetailPanel } from "./CellDetailPanel";

const THREAT_STYLE: Record<string, { bg: string; label: string }> = {
  critical: { bg: "bg-[var(--signal-red)] text-white", label: "极高" },
  high: { bg: "bg-[var(--signal-red)]/55 text-white", label: "高" },
  medium: { bg: "bg-[var(--signal-yellow)]/45 text-[var(--color-text-primary)]", label: "中" },
  low: { bg: "bg-[var(--signal-green)]/30 text-[var(--color-text-primary)]", label: "低" },
};

export function CompetitiveCube({ data }: { data: WorkbenchData }) {
  const topRegions = useMemo(() =>
    data.regions.filter((r) => {
      const parent = data.regions.find((p) => p.id === r.parentId);
      return parent && parent.parentId === null;
    }), [data.regions]);

  const provincesByRegion = useMemo(() => {
    const map: Record<string, typeof data.regions> = {};
    for (const r of data.regions) {
      const parent = data.regions.find((p) => p.id === r.parentId);
      if (parent && parent.parentId !== null) (map[parent.id] ??= []).push(r);
    }
    return map;
  }, [data]);

  const [productLineId, setProductLineId] = useState(data.productLines[0]?.id ?? "");
  const [hiddenBrands, setHiddenBrands] = useState<Set<string>>(new Set());
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<{ regionId: string; competitorId: string } | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const visibleBrands = data.brands.filter((b) => !hiddenBrands.has(b.id));
  const toggleBrand = (id: string) =>
    setHiddenBrands((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleExpand = (id: string) =>
    setExpandedRegions((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const cellsForLine = data.cells.filter((c) => c.productLineId === productLineId);
  const cellAt = (regionId: string, competitorId: string) =>
    cellsForLine.find((c) => c.regionId === regionId && c.competitorId === competitorId);
  const hotForBrand = (brandId: string) =>
    data.hotProducts.filter((p) => p.brandId === brandId && p.productLineId === productLineId);

  const selectedCell = selected ? cellAt(selected.regionId, selected.competitorId) : null;

  const rows = useMemo(() => {
    const list: { id: string; name: string; isProvince: boolean }[] = [];
    for (const r of topRegions) {
      list.push({ id: r.id, name: r.name, isProvince: false });
      if (expandedRegions.has(r.id))
        for (const p of provincesByRegion[r.id] ?? [])
          list.push({ id: p.id, name: p.name, isProvince: true });
    }
    return list;
  }, [topRegions, expandedRegions, provincesByRegion]);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-title">竞争战场图 · 大区主战视角</h2>
          <p className="text-caption">行 = 大区（▸ 展开至省），列 = 竞品。点击格子下钻；空格点击建档。</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <div className="relative">
            <button onClick={() => setFilterOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-md border border-black/10 px-3 py-1.5 text-sm hover:bg-black/[0.04]">
              竞品筛选
              {hiddenBrands.size > 0 && (
                <span className="rounded-full bg-[var(--color-accent)] px-1.5 text-[10px] text-white">{data.brands.length - hiddenBrands.size}/{data.brands.length}</span>
              )}
            </button>
            {filterOpen && (
              <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-lg border border-[var(--surface-border)] bg-[var(--surface-panel)] p-2 shadow-lg">
                {data.brands.map((b) => (
                  <label key={b.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-black/[0.04]">
                    <input type="checkbox" checked={!hiddenBrands.has(b.id)} onChange={() => toggleBrand(b.id)} className="accent-[var(--color-accent)]" />
                    <span>{b.name}</span>
                    <span className="ml-auto text-[10px] text-[var(--color-text-muted)]">{b.tier === "core" ? "核心" : "观察"}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          {data.productLines.map((pl) => (
            <button key={pl.id} onClick={() => { setProductLineId(pl.id); setSelected(null); }}
              className={"rounded-md px-3 py-1.5 text-sm transition-colors " + (
                productLineId === pl.id ? "bg-[var(--color-accent)] text-white" : "border border-black/10 hover:bg-black/[0.04]"
              )}>
              {pl.name}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[var(--surface-border)]">
        <table className="w-full min-w-[600px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--surface-border)]">
              <th className="bg-[var(--surface-panel)] px-4 py-2.5 text-left font-medium text-[var(--color-text-muted)] w-32">大区 / 省</th>
              {visibleBrands.map((b) => (
                <th key={b.id} className="px-3 py-2 text-center">
                  <div className="font-medium text-[var(--color-text-secondary)] text-sm">{b.name}</div>
                  {hotForBrand(b.id).length > 0 && (
                    <div className="text-[10px] font-normal text-[var(--signal-yellow)]">🔥 {hotForBrand(b.id).length}款爆品</div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className={"border-b border-[var(--surface-border)] last:border-0" + (row.isProvince ? " bg-black/[0.015]" : "")}>
                <td className="bg-[var(--surface-panel)] py-2 font-medium">
                  {row.isProvince ? (
                    <span className="pl-8 text-xs text-[var(--color-text-secondary)]">{row.name}</span>
                  ) : (
                    <button onClick={() => toggleExpand(row.id)}
                      className="flex w-full items-center gap-1 px-4 text-left text-sm text-[var(--color-text-primary)]">
                      <span className="text-xs text-[var(--color-text-muted)]">{expandedRegions.has(row.id) ? "▾" : "▸"}</span>
                      {row.name}
                      {(provincesByRegion[row.id]?.length ?? 0) > 0 && (
                        <span className="text-[10px] text-[var(--color-text-muted)]">({provincesByRegion[row.id]!.length}省)</span>
                      )}
                    </button>
                  )}
                </td>
                {visibleBrands.map((b) => {
                  const cell = cellAt(row.id, b.id);
                  const isSel = selected?.regionId === row.id && selected?.competitorId === b.id;
                  return (
                    <td key={b.id} className="p-1.5 text-center">
                      {cell ? (
                        <button
                          onClick={() => setSelected({ regionId: row.id, competitorId: b.id })}
                          className={"w-full rounded px-2 py-2 text-xs font-medium transition-transform hover:scale-[1.03] " + THREAT_STYLE[cell.threatLevel].bg + (isSel ? " ring-2 ring-[var(--color-accent)] ring-offset-1" : "")}
                          title={cell.summary ?? ""}>
                          {THREAT_STYLE[cell.threatLevel].label}
                          {cell.ourPosition === "lag" && <span className="ml-0.5">↓</span>}
                          {cell.ourPosition === "lead" && <span className="ml-0.5">↑</span>}
                          {hotForBrand(b.id).length > 0 && <span className="ml-0.5 text-[9px]">🔥</span>}
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelected({ regionId: row.id, competitorId: b.id })}
                          className="w-full rounded border border-dashed border-black/10 py-2 text-[10px] text-[var(--color-text-muted)] hover:border-[var(--color-accent)]/50 hover:text-[var(--color-accent)] transition-colors">
                          + 建档
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-caption">
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-[var(--signal-red)]" />极高</span>
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-[var(--signal-red)]/55" />高</span>
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-[var(--signal-yellow)]/45" />中</span>
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-[var(--signal-green)]/30" />低</span>
        <span>↑ 领先 · ↓ 落后 · 🔥 爆款 · 空格可建档</span>
      </div>

      {data.hotProducts.filter((p) => p.productLineId === productLineId).length > 0 && (
        <div className="rounded-lg border border-[var(--signal-yellow)]/30 bg-[var(--signal-yellow)]/5 p-4">
          <p className="mb-2.5 text-xs font-semibold text-[var(--color-text-secondary)]">🔥 爆款信号追踪</p>
          <div className="space-y-2.5">
            {data.hotProducts.filter((p) => p.productLineId === productLineId).map((p) => (
              <div key={p.id} className="flex gap-3 text-xs">
                <span className="shrink-0 rounded bg-[var(--signal-yellow)]/20 px-1.5 py-0.5 font-mono font-semibold text-[var(--signal-yellow)]">#{p.hotRank}</span>
                <div>
                  <span className="font-medium text-[var(--color-text-primary)]">{p.name}</span>
                  {p.modelCode && <span className="ml-2 text-[var(--color-text-muted)]">{p.modelCode}</span>}
                  {p.salesVelocity && <span className="ml-2 rounded bg-black/[0.06] px-1 py-0.5 text-[var(--color-text-muted)]">{p.salesVelocity}</span>}
                  {p.hotSignalNote && <p className="mt-0.5 leading-relaxed text-[var(--color-text-secondary)]">{p.hotSignalNote}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selected && (
        <CellDetailPanel
          productLineId={productLineId}
          regionId={selected.regionId}
          competitorId={selected.competitorId}
          productLineName={data.productLines.find((p) => p.id === productLineId)?.name ?? ""}
          regionName={data.regions.find((r) => r.id === selected.regionId)?.name ?? ""}
          competitorName={data.brands.find((b) => b.id === selected.competitorId)?.name ?? ""}
          summary={selectedCell?.summary ?? null}
          onClose={() => setSelected(null)}
          onSaved={() => window.location.reload()}
        />
      )}
    </section>
  );
}
