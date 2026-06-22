import { FiveForcesPanel } from "@/components/gates/FiveForcesPanel";
import { GatesPageClient } from "@/components/gates/GatesPageClient";
import { PageHeader } from "@/components/ui/PageHeader";
import { getFiveForceRecords } from "@/lib/gates/five-forces";
import { getGateChecklists, gateSummaryFrom } from "@/lib/gates/data-access";

export default async function GatesPage() {
  const [{ checklists, source }, fiveForces] = await Promise.all([
    getGateChecklists(),
    getFiveForceRecords(),
  ]);
  const summary = gateSummaryFrom(checklists);

  return (
    <div className="stratos-page">
      <PageHeader
        eyebrow="工具 · 战略会"
        title="战略会准入"
        subtitle="开 Invest / Innovate / Deliver 会之前的检查清单 — 输出风险项，非综合打分"
      />
      <GatesPageClient initialChecklists={checklists} initialSummary={summary} source={source} />

      <div className="mt-10 border-t border-[var(--surface-border)] pt-8">
        <FiveForcesPanel records={fiveForces.records} source={fiveForces.source} />
      </div>
    </div>
  );
}
