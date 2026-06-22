"use client";

import type { ManagementReportBundle } from "@/lib/fpa/management-types";

function pct(v: number) {
  return `${(v * 100).toFixed(1)}%`;
}

// Primary hero card — used only for ROS (lead metric)
function KpiHero({ label, actual, budget, forecast }: {
  label: string; actual: number; budget: number; forecast: number;
}) {
  const vs = actual - budget;
  return (
    <div className="rounded-lg border border-[var(--color-accent)]/40 bg-[var(--surface-panel)] p-5 col-span-2">
      <div className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">{label}</div>
      <div className="mt-2 font-data text-4xl text-[var(--color-accent)]">{pct(actual)}</div>
      <div className="mt-3 flex gap-4 text-xs text-[var(--color-text-muted)]">
        <span>B {pct(budget)}</span>
        <span>F {pct(forecast)}</span>
        <span className={vs >= 0 ? "text-[var(--signal-green)]" : "text-[var(--signal-red)]"}>
          vs B {vs >= 0 ? "+" : ""}{pct(vs)}
        </span>
      </div>
    </div>
  );
}

// Secondary card for supporting KPIs
function KpiCard({ label, actual, budget, forecast, format = "pct" }: {
  label: string; actual: number; budget: number; forecast: number;
  format?: "pct" | "amount";
}) {
  const fmt = (v: number) => format === "pct" ? pct(v) : `${Math.round(v)} 万`;
  return (
    <div className="rounded-lg border border-[var(--surface-border)] bg-[var(--surface-panel)] p-4">
      <div className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">{label}</div>
      <div className="mt-2 font-data text-2xl text-[var(--color-text-primary)]">{fmt(actual)}</div>
      <div className="mt-2 flex gap-3 text-xs text-[var(--color-text-muted)]">
        <span>B {fmt(budget)}</span>
        <span>F {fmt(forecast)}</span>
      </div>
    </div>
  );
}

export function ManagementReportPanel({ report }: { report: ManagementReportBundle }) {
  const { kpis, marginBridge } = report;
  const bridgeMax = Math.max(...marginBridge.map((i) => Math.abs(i.cumulative)), 1);

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-[var(--color-accent)]/20 bg-[var(--surface-panel)] p-4">
        <h3 className="text-sm font-medium text-[var(--color-accent)]">管理报表 · {report.period}</h3>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          ROS = 净利润 ÷ 营收 · EBITDA 不含 D&A、利息、所得税
        </p>
      </section>

      {/* ROS hero spans 2 cols; supporting KPIs fill remaining 2 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiHero
          label="ROS 销售净利率"
          actual={kpis.rosActual}
          budget={kpis.rosBudget}
          forecast={kpis.rosForecast}
        />
        <KpiCard
          label="EBITDA 利润率"
          actual={kpis.ebitdaMarginActual}
          budget={kpis.ebitdaMarginBudget}
          forecast={kpis.ebitdaMarginForecast}
        />
        <KpiCard
          label="毛利率"
          actual={kpis.grossMarginActual}
          budget={kpis.grossMarginBudget}
          forecast={kpis.grossMarginForecast}
        />
      </div>

      <section className="rounded-lg border border-[var(--surface-border)] bg-[var(--surface-panel)] p-6">
        <h3 className="mb-4 text-sm font-medium text-[var(--color-text-secondary)]">利润桥（Actual · 万元）</h3>
        <div className="space-y-2">
          {marginBridge.map((item) => {
            const isTotal = item.label.startsWith("=");
            const barW = `${Math.round((Math.abs(item.cumulative) / bridgeMax) * 100)}%`;
            return (
              <div key={item.label} className="space-y-0.5">
                <div className="flex items-center justify-between text-xs">
                  <span className={isTotal ? "font-medium text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)]"}>
                    {item.label}
                  </span>
                  <span className={`font-data ${isTotal ? "text-[var(--color-accent)]" : "text-[var(--color-text-secondary)]"}`}>
                    {Math.round(item.cumulative)}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-black/[0.04] overflow-hidden">
                  <div
                    className={`h-full rounded-full ${isTotal ? "bg-[var(--color-accent)] opacity-80" : "bg-[var(--bsc-financial)] opacity-40"}`}
                    style={{ width: barW }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-[var(--color-text-muted)]">
          ROS Actual = {pct(kpis.rosActual)} · 详见「利润表 / 资产负债表 / 现金流量表」Tab
        </p>
      </section>
    </div>
  );
}
