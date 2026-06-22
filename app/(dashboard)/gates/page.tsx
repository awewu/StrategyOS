import { GatesPageClient } from "@/components/gates/GatesPageClient";
import { PageHeader } from "@/components/ui/PageHeader";
import { getGateChecklists, gateSummaryFrom } from "@/lib/gates/data-access";

export default async function GatesPage() {
  const { checklists, source } = await getGateChecklists();
  const summary = gateSummaryFrom(checklists);

  return (
    <div className="stratos-page">
      <PageHeader
        eyebrow="工具 · 战略会"
        title="战略会准入"
        subtitle="开 Invest / Innovate / Deliver 会之前的检查清单 — 输出风险项，非综合打分"
      />
      <GatesPageClient initialChecklists={checklists} initialSummary={summary} source={source} />
    </div>
  );
}
