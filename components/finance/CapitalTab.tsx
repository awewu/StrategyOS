import type { CapStackPeriod, CapacitySnapshot, InvestmentCase } from "@/lib/types/stratos";
import { forecastAmount } from "@/lib/stratos/fpa-toggle";

function KanbanColumn({
  title,
  items,
}: {
  title: string;
  items: InvestmentCase[];
}) {
  return (
    <div className="min-w-[200px] flex-1 rounded-lg bg-[var(--surface-raised)] p-3">
      <div className="mb-3 text-xs uppercase tracking-wider text-[#828c8d]">{title}</div>
      <div className="space-y-2">
        {items.map((ic) => (
          <div
            key={ic.id}
            className="cursor-pointer rounded border border-black/10 bg-[var(--surface-panel)] p-3 transition hover:border-[var(--color-accent)]/40"
          >
            <div className="font-data text-xs text-[var(--color-accent)]">{ic.code}</div>
            <div className="mt-1 text-sm font-medium">{ic.title}</div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-[#828c8d]">
              <span>{ic.capexTotal} 万</span>
              {ic.expectedIrr && <span>IRR {ic.expectedIrr}%</span>}
              <span className="text-[#828c8d]">{ic.budgetTag}</span>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="py-4 text-center text-xs text-[#828c8d]">—</div>
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
      <section className="rounded-lg border border-[var(--color-accent)]/20 bg-[var(--surface-panel)] p-6">
        <h3 className="mb-4 text-sm font-medium text-[var(--color-accent)]">CapStack {capStack.period}</h3>
        <div className="mb-4">
          <div className="mb-1 flex justify-between text-xs text-[#828c8d]">
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
            <div className="bg-sky-500" style={{ width: `${bPct}%` }} title="Actual" />
            <div className="bg-violet-500/70" style={{ width: `${fPct - bPct}%` }} title="Forecast" />
          </div>
        </div>
        <div className="grid gap-4 text-sm md:grid-cols-3">
          <div>
            <span className="text-[#828c8d]">三层面 </span>
            H1 {capStack.byHorizon.H1}% · H2 {capStack.byHorizon.H2}% · H3{" "}
            {capStack.byHorizon.H3}%
          </div>
          <div>
            <span className="text-[#828c8d]">现金波峰 </span>
            <span className="font-data text-[var(--color-accent)]">
              {capStack.cashPeakMonth} ¥{capStack.cashPeakAmount}万
            </span>
          </div>
          <div>
            <span className="text-[#828c8d]">波峰后 runway </span>
            <span
              className={`font-data ${capStack.runwayAfterPeak < 3 ? "text-[#8b0e04]" : ""}`}
            >
              {capStack.runwayAfterPeak} 月
            </span>
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-medium text-[#828c8d]">投资管道</h3>
        <div className="flex gap-3 overflow-x-auto pb-2">
          <KanbanColumn title="Review" items={columns.review} />
          <KanbanColumn title="Approved" items={columns.approved} />
          <KanbanColumn title="Post Invest" items={columns.post_invest} />
          <KanbanColumn title="Killed" items={columns.killed} />
        </div>
      </section>

      <section className="rounded-lg border border-black/10 bg-[var(--surface-panel)] p-6">
        <h3 className="mb-3 text-sm font-medium text-[#828c8d]">产能缺口反推</h3>
        <div className="grid gap-2 font-data text-sm md:grid-cols-4">
          <div>需求 {capacity.demandUnits.toLocaleString()} 台</div>
          <div>产能 {capacity.capacityUnits.toLocaleString()} 台</div>
          <div className="text-[#8b0e04]">缺口 {capacity.gapUnits.toLocaleString()} 台</div>
          <div>利用率 {capacity.utilizationPct}% → {capacity.linkedIcCode}</div>
        </div>
      </section>
    </div>
  );
}
