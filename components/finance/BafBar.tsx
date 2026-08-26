import type { FpaSummary } from "@/lib/types/stratos";
import { SectionCard } from "@/components/ui/KpiTile";

// Each metric row shows B/A/F as three parallel bars scaled to that metric's own max.
function BafRow({ label, budget, actual, forecast }: {
  label: string; budget: number; actual: number; forecast: number;
}) {
  const max = Math.max(Math.abs(budget), Math.abs(actual), Math.abs(forecast), 1);
  const w = (v: number) => `${Math.round((Math.abs(v) / max) * 100)}%`;
  const fmt = (v: number) => v.toLocaleString("zh-CN");
  const bars: { key: string; value: number; color: string }[] = [
    { key: "B", value: budget,   color: "var(--chart-baf-budget)" },
    { key: "A", value: actual,   color: "var(--chart-baf-actual)" },
    { key: "F", value: forecast, color: "var(--chart-baf-forecast)" },
  ];
  return (
    <div className="space-y-1.5">
      <div className="text-xs font-medium text-[var(--color-text-secondary)]">{label}</div>
      {bars.map(({ key, value, color }) => (
        <div key={key} className="flex items-center gap-2">
          <span className="w-4 shrink-0 text-right font-data text-caption">{key}</span>
          <div className="flex-1 h-2 rounded-full bg-black/[0.04] overflow-hidden">
            <div className="h-full rounded-full" style={{ width: w(value), background: color }} />
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
    <SectionCard
      title="B·A·F 三段对比"
      dense
      action={
        <span className={`font-data text-sm ${fpa.cashRunwayMonths < 3 ? "text-[var(--signal-red-text)]" : "text-[var(--signal-green-text)]"}`}>
          现金 runway {fpa.cashRunwayMonths} 月
        </span>
      }
    >
      <div className="space-y-5">
        <BafRow label="营收" budget={fpa.revenueBudget} actual={fpa.revenueActual} forecast={fpa.revenueForecast} />
        <BafRow label="利润" budget={fpa.profitBudget} actual={fpa.profitActual} forecast={fpa.profitForecast} />
      </div>
    </SectionCard>
  );
}
