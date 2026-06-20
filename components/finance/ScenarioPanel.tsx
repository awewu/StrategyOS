import type { Scenario } from "@/lib/types/stratos";

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
      <section className="rounded-lg border border-[var(--color-accent-gold)]/20 bg-[var(--color-bg-surface)] p-6">
        <h3 className="mb-2 text-sm font-medium text-[var(--color-accent-gold)]">
          SPBP 2.0 · 概率 Living Model
        </h3>
        <p className="mb-4 text-xs text-[var(--color-text-muted)]">
          加权期望 · 营收 {Math.round(weightedRev)} 万 · 利润 {Math.round(weightedProfit)} 万
        </p>
        <div className="flex h-3 overflow-hidden rounded-full">
          {scenarios.map((sc) => (
            <div
              key={sc.id}
              className="h-full"
              style={{
                width: `${sc.probability}%`,
                backgroundColor:
                  sc.name === "乐观"
                    ? "#22c55e"
                    : sc.name === "悲观"
                      ? "#8b0e04"
                      : "var(--color-accent-gold)",
              }}
              title={`${sc.name} ${sc.probability}%`}
            />
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-4 text-xs text-[var(--color-text-muted)]">
          {scenarios.map((sc) => (
            <span key={sc.id}>
              {sc.name} {sc.probability}%
            </span>
          ))}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {scenarios.map((sc) => (
          <article
            key={sc.id}
            className="rounded-lg border border-black/10 bg-[var(--color-bg-surface)] p-5"
          >
            <div className="flex items-baseline justify-between">
              <h4 className="font-medium">{sc.name}</h4>
              <span className="font-data text-2xl text-[var(--color-accent-gold)]">
                {sc.probability}%
              </span>
            </div>
            <ul className="mt-3 space-y-1 text-sm text-[var(--color-text-muted)]">
              {sc.drivers.map((d) => (
                <li key={d}>· {d}</li>
              ))}
            </ul>
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-black/[0.06] pt-3 text-xs">
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
                  className={`font-data ${sc.fpaImpact.runwayMonths < 3 ? "text-[#8b0e04]" : ""}`}
                >
                  {sc.fpaImpact.runwayMonths}月
                </div>
              </div>
            </div>
            {sc.linkedAssumptionCodes.length > 0 && (
              <div className="mt-2 text-[10px] text-[var(--color-text-muted)]">
                Hx: {sc.linkedAssumptionCodes.join(", ")}
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
