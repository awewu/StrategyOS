import type { FpaYearRow, SensitivityDriver } from "@/lib/types/stratos";

export function FiveYearForecast({ rows }: { rows: FpaYearRow[] }) {
  const maxRev = Math.max(...rows.map((r) => r.revenueBudget));

  return (
    <section className="stratos-card stratos-card--padded">
      <h3 className="stratos-section-title mb-4 text-[var(--color-accent)]">
        5 年 FPA 展望 · B-A-F
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-[var(--color-text-muted)]">
            <tr>
              <th className="pb-2">年度</th>
              <th className="pb-2">营收 B/F（万）</th>
              <th className="pb-2">利润 B/F（万）</th>
              <th className="pb-2">CAPEX B（万）</th>
              <th className="pb-2">趋势</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const revGap = r.revenueForecast - r.revenueBudget;
              const barW = Math.round((r.revenueBudget / maxRev) * 100);
              return (
                <tr key={r.year} className="border-t border-[var(--surface-border)]">
                  <td className="py-3 font-data text-[var(--color-accent)]">{r.year}</td>
                  <td className="py-3 font-data">
                    {r.revenueBudget} / {r.revenueForecast}
                    <span
                      className={`ml-2 text-xs ${revGap < 0 ? "text-[var(--fpa-kpi-negative)]" : "text-[var(--fpa-kpi-positive)]"}`}
                    >
                      {revGap >= 0 ? "+" : ""}
                      {revGap}
                    </span>
                  </td>
                  <td className="py-3 font-data">
                    {r.profitBudget} / {r.profitForecast}
                  </td>
                  <td className="py-3 font-data">{r.capexBudget}</td>
                  <td className="py-3">
                    <div className="h-2 w-24 overflow-hidden rounded-full bg-black/[0.06]">
                      <div
                        className="h-full rounded-full bg-[var(--color-accent)]"
                        style={{ width: `${barW}%` }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function SensitivityPanel({ drivers }: { drivers: SensitivityDriver[] }) {
  return (
    <section className="stratos-card stratos-card--padded">
      <h3 className="stratos-section-title mb-4">
        敏感性分析 · 利润影响（万）
      </h3>
      <div className="space-y-4">
        {drivers.map((d) => (
          <div key={d.id}>
            <div className="mb-2 flex flex-wrap justify-between gap-2 text-sm">
              <span>{d.label}</span>
              <span className="font-data text-xs text-[var(--color-text-muted)]">
                基准 {d.baseValue}
                {d.unit}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-16 text-right font-data text-xs text-[var(--fpa-kpi-negative)]">
                {d.impactOnProfit.low}
              </span>
              <div className="relative h-3 flex-1 rounded-full bg-black/[0.06]">
                <div className="absolute left-1/2 top-0 h-full w-px bg-black/15" />
                <div
                  className="absolute top-0 h-full rounded-l-full bg-[color-mix(in_srgb,var(--fpa-kpi-negative)_70%,transparent)]"
                  style={{ right: "50%", left: `${Math.min(45, Math.abs(d.impactOnProfit.low) / 5)}%` }}
                />
                <div
                  className="absolute top-0 h-full rounded-r-full bg-[color-mix(in_srgb,var(--fpa-kpi-positive)_70%,transparent)]"
                  style={{ left: "50%", width: `${Math.min(45, d.impactOnProfit.high / 5)}%` }}
                />
              </div>
              <span className="w-16 font-data text-xs text-[var(--fpa-kpi-positive)]">
                +{d.impactOnProfit.high}
              </span>
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-[var(--color-text-muted)]">
              <span>
                低情景 {d.baseValue + d.lowDelta}
                {d.unit}
              </span>
              <span>
                高情景 {d.baseValue + d.highDelta}
                {d.unit}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
