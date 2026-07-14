import type { Scenario } from "@/lib/types/stratos";
import { SectionCard } from "@/components/ui/KpiTile";

export function ScenarioPanel({ scenarios }: { scenarios: Scenario[] }) {
  const weightedRev = scenarios.reduce(
    (s, sc) => s + sc.fpaImpact.revenue * (sc.probability / 100),
    0
  );
  const weightedProfit = scenarios.reduce(
    (s, sc) => s + sc.fpaImpact.profit * (sc.probability / 100),
    0
  );

  return (
    <div className="space-y-6">
      <SectionCard
        title="SPBP 2.0 · 概率 Living Model"
        subtitle={`加权期望 · 营收 ${Math.round(weightedRev)} 万 · 利润 ${Math.round(weightedProfit)} 万`}
        accent="gold"
        dense
      >
        <div className="flex h-3 overflow-hidden rounded-full">
          {scenarios.map((sc) => (
            <div
              key={sc.id}
              className="h-full"
              style={{
                width: `${sc.probability}%`,
                backgroundColor:
                  sc.name === "乐观"
                    ? "var(--signal-green)"
                    : sc.name === "悲观"
                      ? "var(--signal-red)"
                      : "var(--color-accent)",
              }}
              title={`${sc.name} ${sc.probability}%`}
            />
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-4 text-caption">
          {scenarios.map((sc) => (
            <span key={sc.id}>
              {sc.name} {sc.probability}%
            </span>
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-4 md:grid-cols-3">
        {scenarios.map((sc) => (
          <article
            key={sc.id}
            className="rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-5"
          >
            <div className="flex items-baseline justify-between">
              <h4 className="font-medium">{sc.name}</h4>
              <span className="font-data text-2xl text-[var(--color-accent)]">
                {sc.probability}%
              </span>
            </div>
            <ul className="mt-3 space-y-1 text-sm text-[var(--color-text-muted)]">
              {sc.drivers.map((d) => (
                <li key={d}>· {d}</li>
              ))}
            </ul>
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[var(--surface-border)] pt-3 text-xs">
              <div>
                <div className="text-[var(--color-text-muted)]">营收</div>
                <div className="font-data">{sc.fpaImpact.revenue}</div>
              </div>
              <div>
                <div className="text-[var(--color-text-muted)]">利润</div>
                <div className="font-data">{sc.fpaImpact.profit}</div>
              </div>
              <div>
                <div className="text-[var(--color-text-muted)]">Runway</div>
                <div
                  className={`font-data ${sc.fpaImpact.runwayMonths < 3 ? "text-[var(--fpa-kpi-negative)]" : ""}`}
                >
                  {sc.fpaImpact.runwayMonths}月
                </div>
              </div>
            </div>
            {sc.linkedAssumptionCodes.length > 0 && (
              <div className="mt-2 text-[11px] text-[var(--color-text-muted)]">
                Hx: {sc.linkedAssumptionCodes.join(", ")}
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
