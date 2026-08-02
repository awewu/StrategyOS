"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FiveYearForecast, SensitivityPanel } from "@/components/finance/FiveYearForecast";
import { Input } from "@/components/ui/primitives";
import type { FpaYearRow, SensitivityDriver } from "@/lib/types/stratos";

function numInput(value: number, onChange: (v: number) => void) {
  return (
    <Input
      type="number"
      inputSize="sm"
      fullWidth
      className="font-data"
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}

export function OutlookEditor({
  initialRows,
  initialDrivers,
  source,
}: {
  initialRows: FpaYearRow[];
  initialDrivers: SensitivityDriver[];
  source: "database" | "demo";
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [drivers, setDrivers] = useState(initialDrivers);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function patchRow(index: number, patch: Partial<FpaYearRow>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function patchDriver(index: number, patch: Partial<SensitivityDriver>) {
    setDrivers((prev) =>
      prev.map((d, i) =>
        i === index
          ? {
              ...d,
              ...patch,
              impactOnProfit: patch.impactOnProfit
                ? { ...d.impactOnProfit, ...patch.impactOnProfit }
                : d.impactOnProfit,
            }
          : d,
      ),
    );
  }

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/fpa/outlook", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fiveYearForecast: rows, sensitivityDrivers: drivers }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "保存失败");
      setEditing(false);
      setMsg("战略展望已保存");
      router.refresh();
      window.setTimeout(() => setMsg(null), 3500);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }

  function cancel() {
    setRows(initialRows);
    setDrivers(initialDrivers);
    setEditing(false);
    setMsg(null);
  }

  return (
    <div className="stratos-page">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-caption">
          数据源 {source === "database" ? "DB · 可持久化" : "Demo · 保存需配置 DATABASE_URL"}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {msg ? <span className="text-caption text-[var(--color-accent)]">{msg}</span> : null}
          {editing ? (
            <>
              <button type="button" onClick={cancel} className="stratos-btn stratos-btn--ghost" disabled={busy}>
                取消
              </button>
              <button type="button" onClick={() => void save()} className="stratos-btn stratos-btn--primary" disabled={busy}>
                {busy ? "保存中…" : "保存"}
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setEditing(true)} className="stratos-btn stratos-btn--primary">
              编辑展望数据
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <>
          <section className="stratos-card stratos-card--padded">
            <h3 className="stratos-section-title mb-4">5 年 FPA 展望 · B-A-F</h3>
            <div className="stratos-table-wrap">
              <table className="stratos-table">
                <thead>
                  <tr>
                    <th>年度</th>
                    <th>营收 B</th>
                    <th>营收 F</th>
                    <th>利润 B</th>
                    <th>利润 F</th>
                    <th>CAPEX B</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.year}>
                      <td>
                        <Input
                          inputSize="sm"
                          className="w-20 font-data"
                          value={r.year}
                          onChange={(e) => patchRow(i, { year: e.target.value })}
                        />
                      </td>
                      <td>{numInput(r.revenueBudget, (v) => patchRow(i, { revenueBudget: v }))}</td>
                      <td>{numInput(r.revenueForecast, (v) => patchRow(i, { revenueForecast: v }))}</td>
                      <td>{numInput(r.profitBudget, (v) => patchRow(i, { profitBudget: v }))}</td>
                      <td>{numInput(r.profitForecast, (v) => patchRow(i, { profitForecast: v }))}</td>
                      <td>{numInput(r.capexBudget, (v) => patchRow(i, { capexBudget: v }))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="stratos-card stratos-card--padded space-y-5">
            <h3 className="stratos-section-title">敏感性分析 · 利润影响（万）</h3>
            {drivers.map((d, i) => (
              <div key={d.id} className="rounded-lg border border-[var(--surface-border)] p-4 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <label className="block">
                    <span className="label-xs">驱动项</span>
                    <Input
                      fullWidth
                      value={d.label}
                      onChange={(e) => patchDriver(i, { label: e.target.value })}
                    />
                  </label>
                  <label className="block">
                    <span className="label-xs">基准值</span>
                    {numInput(d.baseValue, (v) => patchDriver(i, { baseValue: v }))}
                  </label>
                  <label className="block">
                    <span className="label-xs">单位</span>
                    <Input
                      fullWidth
                      value={d.unit}
                      onChange={(e) => patchDriver(i, { unit: e.target.value })}
                    />
                  </label>
                  <label className="block">
                    <span className="label-xs">低 Δ / 高 Δ</span>
                    <div className="flex gap-2">
                      {numInput(d.lowDelta, (v) => patchDriver(i, { lowDelta: v }))}
                      {numInput(d.highDelta, (v) => patchDriver(i, { highDelta: v }))}
                    </div>
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="label-xs">利润影响 · 低情景（万）</span>
                    {numInput(d.impactOnProfit.low, (v) =>
                      patchDriver(i, { impactOnProfit: { ...d.impactOnProfit, low: v } }),
                    )}
                  </label>
                  <label className="block">
                    <span className="label-xs">利润影响 · 高情景（万）</span>
                    {numInput(d.impactOnProfit.high, (v) =>
                      patchDriver(i, { impactOnProfit: { ...d.impactOnProfit, high: v } }),
                    )}
                  </label>
                </div>
              </div>
            ))}
          </section>
        </>
      ) : (
        <>
          <FiveYearForecast rows={rows} />
          <SensitivityPanel drivers={drivers} />
        </>
      )}
    </div>
  );
}
