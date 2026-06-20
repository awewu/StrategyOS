import type { FpaSummary } from "@/lib/types/stratos";

// Each metric row shows B/A/F as three parallel bars scaled to that metric's own max.
function BafRow({ label, budget, actual, forecast }: {
  label: string; budget: number; actual: number; forecast: number;
}) {
  const max = Math.max(Math.abs(budget), Math.abs(actual), Math.abs(forecast), 1);
  const w = (v: number) => `${Math.round((Math.abs(v) / max) * 100)}%`;
  const fmt = (v: number) => v.toLocaleString("zh-CN");
  const bars: { key: string; value: number; cls: string }[] = [
    { key: "B", value: budget,   cls: "bg-[var(--color-accent-gold)] opacity-70" },
    { key: "A", value: actual,   cls: "bg-sky-400" },
    { key: "F", value: forecast, cls: "bg-violet-400 opacity-75" },
  ];
  return (
    <div className="space-y-1.5">
      <div className="text-xs font-medium text-[var(--color-text-secondary)]">{label}</div>
      {bars.map(({ key, value, cls }) => (
        <div key={key} className="flex items-center gap-2">
          <span className="w-4 shrink-0 text-right font-data text-xs text-[var(--color-text-muted)]">{key}</span>
          <div className="flex-1 h-2 rounded-full bg-black/[0.04] overflow-hidden">
            <div className={`h-full rounded-full ${cls}`} style={{ width: w(value) }} />
          </div>
          <span className="w-16 shrink-0 text-right font-data text-xs text-[var(--color-text-secondary)]">
            {fmt(value)} 万
          </span>
        </div>
      ))}
    </div>
  );
}

export function BafBar({ fpa }: { fpa: FpaSummary }) {
  return (
    <section className="rounded-lg border border-black/10 bg-[var(--surface-panel)] p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">B·A·F 三段对比</h3>
        <span className={`font-data text-sm ${fpa.cashRunwayMonths < 3 ? "text-[var(--signal-red)]" : "text-[var(--signal-green)]"}`}>
          现金 runway {fpa.cashRunwayMonths} 月
        </span>
      </div>
      <BafRow label="营收" budget={fpa.revenueBudget} actual={fpa.revenueActual} forecast={fpa.revenueForecast} />
      <BafRow label="利润" budget={fpa.profitBudget} actual={fpa.profitActual} forecast={fpa.profitForecast} />
    </section>
  );
}
