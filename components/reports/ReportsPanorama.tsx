import type { FpaSummary } from "@/lib/types/stratos";
import type { ManagementKpis } from "@/lib/fpa/management-types";

function pct(v: number) { return `${(v * 100).toFixed(1)}%`; }
function wan(v: number) { return `${(v / 10000).toFixed(0)}亿`; }

function KpiRow({ label, actual, budget, fmt = pct }: {
  label: string; actual: number; budget: number;
  fmt?: (v: number) => string;
}) {
  const vs = actual - budget;
  return (
    <div className="grid grid-cols-5 items-center gap-2 py-2 border-b border-[var(--surface-border)] last:border-0 text-sm">
      <span className="col-span-2 text-[var(--color-text-secondary)]">{label}</span>
      <span className="text-right font-data text-[var(--color-text-primary)] tabular-nums">{fmt(actual)}</span>
      <span className="text-right font-data tabular-nums text-[var(--color-text-muted)]">{fmt(budget)}</span>
      <span className={`text-right font-data tabular-nums text-xs ${vs >= 0 ? "text-[var(--signal-green)]" : "text-[var(--signal-red)]"}`}>
        {vs >= 0 ? "+" : ""}{fmt(vs)}
      </span>
    </div>
  );
}

export function ReportsPanorama({ fpa, kpis }: { fpa: FpaSummary; kpis: ManagementKpis }) {
  const revAchieve = fpa.revenueBudget > 0 ? fpa.revenueActual / fpa.revenueBudget : 0;
  const profitAchieve = fpa.profitBudget > 0 ? fpa.profitActual / fpa.profitBudget : 0;

  return (
    <section className="rounded-xl border border-[var(--surface-border)] bg-[var(--surface-panel)] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">经营全景 · ROS / EBITDA</h2>
        <span className="text-caption">{kpis.period}</span>
      </div>

      {/* Revenue + Profit achievement bars */}
      <div className="grid gap-3 sm:grid-cols-2">
        {([
          { label: "营收完成率", value: revAchieve, abs: `${wan(fpa.revenueActual)} / ${wan(fpa.revenueBudget)}` },
          { label: "利润完成率", value: profitAchieve, abs: `${wan(fpa.profitActual)} / ${wan(fpa.profitBudget)}` },
        ] as const).map((item) => (
          <div key={item.label}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[var(--color-text-secondary)]">{item.label}</span>
              <span className="font-data tabular-nums">
                <span className={item.value >= 1 ? "text-[var(--signal-green)]" : item.value >= 0.9 ? "text-[var(--signal-yellow)]" : "text-[var(--signal-red)]"}>
                  {pct(item.value)}
                </span>
                <span className="text-[var(--color-text-muted)] ml-1">· {item.abs}</span>
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--surface-border)] overflow-hidden">
              <div className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(item.value * 100, 100)}%`,
                  backgroundColor: item.value >= 1 ? "var(--signal-green)" : item.value >= 0.9 ? "var(--signal-yellow)" : "var(--signal-red)",
                }} />
            </div>
          </div>
        ))}
      </div>

      {/* KPI table */}
      <div>
        <div className="grid grid-cols-5 gap-2 pb-1 text-[10px] font-medium tracking-wide text-[var(--color-text-muted)]">
          <span className="col-span-2">指标</span>
          <span className="text-right">实际</span>
          <span className="text-right">预算</span>
          <span className="text-right">差异</span>
        </div>
        <KpiRow label="ROS（销售净利率）" actual={kpis.rosActual} budget={kpis.rosBudget} />
        <KpiRow label="EBITDA Margin" actual={kpis.ebitdaMarginActual} budget={kpis.ebitdaMarginBudget} />
        <KpiRow label="毛利率" actual={kpis.grossMarginActual} budget={kpis.grossMarginBudget} />
      </div>

      {/* Cash runway */}
      <div className={`rounded-lg px-4 py-2.5 flex items-center justify-between text-sm ${
        fpa.cashRunwayMonths < 3 ? "bg-[var(--signal-red)]/10 border border-[var(--signal-red)]/30"
        : fpa.cashRunwayMonths < 6 ? "bg-[var(--signal-yellow)]/10 border border-[var(--signal-yellow)]/30"
        : "bg-[var(--signal-green)]/10 border border-[var(--signal-green)]/30"
      }`}>
        <span className="text-[var(--color-text-secondary)]">现金 Runway</span>
        <span className={`font-data font-semibold tabular-nums ${
          fpa.cashRunwayMonths < 3 ? "text-[var(--signal-red)]"
          : fpa.cashRunwayMonths < 6 ? "text-[var(--signal-yellow)]"
          : "text-[var(--signal-green)]"
        }`}>{fpa.cashRunwayMonths.toFixed(1)} 个月</span>
      </div>
    </section>
  );
}
