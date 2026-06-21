import { GateChecklistPanel } from "@/components/gates/GateChecklistPanel";
import { PageHeader } from "@/components/ui/PageHeader";
import { gateChecklists, gateSummary } from "@/lib/gates/checklists";

export default function GatesPage() {
  const summary = gateSummary();

  return (
    <div className="stratos-section-gap flex flex-col">
      <PageHeader
        eyebrow="工具 · 战略会"
        title="战略会准入"
        subtitle="开 Invest / Innovate / Deliver 会之前的检查清单 — 输出风险项，非综合打分"
      />
      <p className="-mt-4 font-data text-xs text-[var(--color-text-muted)]">
        通过 {summary.pass} · 部分 {summary.partial} · 否 {summary.fail} · 与彩排环节、N-1 监测页联动
      </p>
      <div className="grid gap-6 lg:grid-cols-2">
        {gateChecklists.map((g) => (
          <GateChecklistPanel key={g.id} checklist={g} />
        ))}
      </div>
    </div>
  );
}
