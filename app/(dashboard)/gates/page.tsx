import { GateChecklistPanel } from "@/components/gates/GateChecklistPanel";
import { gateChecklists, gateSummary } from "@/lib/gates/checklists";

export default function GatesPage() {
  const summary = gateSummary();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Gate 清单</h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          五事七计 + Invest / Innovate / Deliver · 输出风险清单，非综合分
        </p>
        <p className="mt-2 font-data text-xs text-[var(--color-text-muted)]">
          通过 {summary.pass} · 部分 {summary.partial} · 否 {summary.fail}
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {gateChecklists.map((g) => (
          <GateChecklistPanel key={g.id} checklist={g} />
        ))}
      </div>
    </div>
  );
}
