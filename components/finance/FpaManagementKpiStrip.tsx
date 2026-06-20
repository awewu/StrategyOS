import Link from "next/link";
import type { ManagementKpis } from "@/lib/fpa/management-types";

function pct(v: number) {
  return `${(v * 100).toFixed(1)}%`;
}

export function FpaManagementKpiStrip({ kpis }: { kpis: ManagementKpis }) {
  const items = [
    { label: "ROS 销售净利率", value: pct(kpis.rosActual), sub: `B ${pct(kpis.rosBudget)} · F ${pct(kpis.rosForecast)}` },
    { label: "EBITDA 利润率", value: pct(kpis.ebitdaMarginActual), sub: `B ${pct(kpis.ebitdaMarginBudget)} · F ${pct(kpis.ebitdaMarginForecast)}` },
    { label: "EBITDA", value: `${Math.round(kpis.ebitdaActual)} 万`, sub: `B ${Math.round(kpis.ebitdaBudget)} · F ${Math.round(kpis.ebitdaForecast)}` },
    { label: "毛利率", value: pct(kpis.grossMarginActual), sub: `B ${pct(kpis.grossMarginBudget)} · F ${pct(kpis.grossMarginForecast)}` },
  ];

  return (
    <section className="rounded-lg border border-[var(--color-accent-gold)]/25 bg-[var(--color-bg-surface)] p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium text-[var(--color-accent-gold)]">FPA 管理报表 · {kpis.period}</h2>
          <p className="text-xs text-[var(--color-text-muted)]">ROS / EBITDA / 利润桥 — 详见财务三张表</p>
        </div>
        <Link href="/finance" className="text-sm text-[var(--color-accent-gold)] hover:underline">
          完整管理报表 →
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="rounded border border-black/10 bg-[var(--surface-raised)] p-4">
            <div className="text-xs text-[var(--color-text-muted)]">{item.label}</div>
            <div className="mt-1 font-data text-xl text-[var(--color-accent-gold)]">{item.value}</div>
            <div className="mt-1 text-xs text-[var(--color-text-muted)]">{item.sub}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
