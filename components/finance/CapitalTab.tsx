import type { CapStackPeriod, CapacitySnapshot, InvestmentCase } from "@/lib/types/stratos";
import { forecastAmount } from "@/lib/stratos/fpa-toggle";
import { SectionCard } from "@/components/ui/KpiTile";
import { CapacityEditor } from "@/components/finance/CapacityEditor";

function KanbanColumn({
  title,
  items,
}: {
  title: string;
  items: InvestmentCase[];
}) {
  return (
    <div className="min-w-[200px] flex-1 rounded-lg bg-[var(--surface-raised)] p-3">
      <div className="mb-3 text-xs tracking-wide text-[var(--color-text-muted)]">{title}</div>
      <div className="space-y-2">
        {items.map((ic) => (
          <div
            key={ic.id}
            className="cursor-pointer rounded border border-[var(--surface-border)] bg-[var(--surface-panel)] p-3 transition hover:border-[var(--color-accent)]/40"
          >
            <div className="font-data text-xs text-[var(--color-accent)]">{ic.code}</div>
            <div className="mt-1 text-sm font-medium">{ic.title}</div>
            <div className="mt-2 flex flex-wrap gap-2 text-caption">
              <span>{ic.capexTotal} 万</span>
              {ic.expectedIrr && <span>IRR {ic.expectedIrr}%</span>}
              <span className="text-[var(--color-text-muted)]">{ic.budgetTag}</span>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="py-4 text-center text-caption">—</div>
        )}
      </div>
    </div>
  );
}

export function CapitalTab({
  capStack,
  capacity,
  investmentCases,
}: {
  capStack: CapStackPeriod;
  capacity: CapacitySnapshot;
  investmentCases: InvestmentCase[];
}) {
  const bPct = Math.round((capStack.capexActual / capStack.capexBudget) * 100);
  const fPct = Math.round((capStack.capexForecast / capStack.capexBudget) * 100);
  const { forecast, ghost } = forecastAmount(
    capStack.capexForecast,
    "on",
    capStack.capexForecast
  );

  const columns: Record<string, InvestmentCase[]> = {
    review: investmentCases.filter((i) => i.gateStatus === "review"),
    approved: investmentCases.filter((i) => i.gateStatus === "approved"),
    post_invest: investmentCases.filter((i) => i.gateStatus === "post_invest"),
    killed: investmentCases.filter((i) => i.gateStatus === "killed"),
  };

  return (
    <div className="space-y-6">
      <SectionCard title={`CapStack ${capStack.period}`} accent="teal" dense>
        <div className="mb-4">
          <div className="mb-1 flex justify-between text-caption">
            <span>CAPEX B-A-F（万）</span>
            <span className="font-data">
              B {capStack.capexBudget} · A {capStack.capexActual} · F {forecast}
              {ghost ? ` · ghost ${ghost}` : ""}
            </span>
          </div>
          <div className="flex h-4 overflow-hidden rounded-full bg-black/[0.04]">
            <div className="bg-[var(--color-accent)]" style={{ width: "100%" }} title="Budget" />
          </div>
          <div className="mt-1 flex h-3 overflow-hidden rounded-full bg-black/[0.04]">
            <div className="bg-[var(--chart-baf-actual)]" style={{ width: `${bPct}%` }} title="Actual" />
            <div className="bg-[var(--chart-baf-forecast)]" style={{ width: `${fPct - bPct}%` }} title="Forecast" />
          </div>
        </div>
        <div className="grid gap-4 text-sm md:grid-cols-3">
          <div>
            <span className="text-[var(--color-text-muted)]">三层面 </span>
            H1 {capStack.byHorizon.H1}% · H2 {capStack.byHorizon.H2}% · H3{" "}
            {capStack.byHorizon.H3}%
          </div>
          <div>
            <span className="text-[var(--color-text-muted)]">现金波峰 </span>
            <span className="font-data text-[var(--color-accent)]">
              {capStack.cashPeakMonth} ¥{capStack.cashPeakAmount}万
            </span>
          </div>
          <div>
            <span className="text-[var(--color-text-muted)]">波峰后 runway </span>
            <span
              className={`font-data ${capStack.runwayAfterPeak < 3 ? "text-[var(--fpa-kpi-negative)]" : ""}`}
            >
              {capStack.runwayAfterPeak} 月
            </span>
          </div>
        </div>
      </SectionCard>

      {/* Three-stack allocation breakdown */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-[var(--surface-border)] bg-[var(--surface-panel)] p-4">
          <h3 className="mb-3 text-xs font-medium tracking-wide text-[var(--color-text-muted)]">品牌分配</h3>
          <div className="space-y-2">
            {Object.entries(capStack.byBrand ?? {}).map(([brand, pct]) => (
              <div key={brand} className="flex items-center gap-2">
                <span className="w-24 shrink-0 text-xs text-[var(--color-text-secondary)]">{brand}</span>
                <div className="flex-1 h-2 rounded-full bg-black/[0.04] overflow-hidden">
                  <div className="h-full rounded-full bg-[var(--color-accent)]" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-8 shrink-0 text-right font-data text-caption">{pct}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-[var(--surface-border)] bg-[var(--surface-panel)] p-4">
          <h3 className="mb-3 text-xs font-medium tracking-wide text-[var(--color-text-muted)]">投入类型</h3>
          <div className="space-y-2">
            {Object.entries(capStack.byType ?? {}).map(([type, pct]) => (
              <div key={type} className="flex items-center gap-2">
                <span className="w-24 shrink-0 text-xs text-[var(--color-text-secondary)]">{type}</span>
                <div className="flex-1 h-2 rounded-full bg-black/[0.04] overflow-hidden">
                  <div className="h-full rounded-full bg-[var(--stack-prod)]" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-8 shrink-0 text-right font-data text-caption">{pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-medium text-[var(--color-text-muted)]">投资管道</h3>
        <div className="flex gap-3 overflow-x-auto pb-2">
          <KanbanColumn title="Review" items={columns.review} />
          <KanbanColumn title="Approved" items={columns.approved} />
          <KanbanColumn title="Post Invest" items={columns.post_invest} />
          <KanbanColumn title="Killed" items={columns.killed} />
        </div>
      </section>

      <SectionCard title="产能缺口反推" dense>
        <div className="grid gap-2 font-data text-sm md:grid-cols-4">
          <div>需求 {capacity.demandUnits.toLocaleString()} 台</div>
          <div>产能 {capacity.capacityUnits.toLocaleString()} 台</div>
          <div className="text-[var(--fpa-kpi-negative)]">缺口 {capacity.gapUnits.toLocaleString()} 台</div>
          <div>利用率 {capacity.utilizationPct}% → {capacity.linkedIcCode}</div>
        </div>
        <details className="mt-3">
          <summary className="cursor-pointer text-caption">记录本期产能快照</summary>
          <div className="mt-3">
            <CapacityEditor />
          </div>
        </details>
      </SectionCard>
    </div>
  );
}
