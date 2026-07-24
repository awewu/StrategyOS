import { FiveForcesPanel } from "@/components/gates/FiveForcesPanel";
import { GatesPageClient } from "@/components/gates/GatesPageClient";
import { MeetingToolsClient } from "@/components/meeting/MeetingToolsClient";
import { RehearsalWalkthrough } from "@/components/rehearsal/RehearsalWalkthrough";
import { DecisionReviewPanel } from "@/components/council/DecisionReviewPanel";
import { getDecisionReviewCards } from "@/lib/council/decision-review";
import { PageHeader } from "@/components/ui/PageHeader";
import { StratosTabNav } from "@/components/ui/StratosTabNav";
import { getRehearsalBundle } from "@/lib/data/strategy-data";
import { getFiveForceRecords } from "@/lib/gates/five-forces";
import { getGateChecklists, gateSummaryFrom } from "@/lib/gates/data-access";

export const metadata = { title: "战略会 · StratOS" };

type CouncilTab = "rehearsal" | "gates" | "meeting" | "review";

const TABS: { id: CouncilTab; label: string }[] = [
  { id: "rehearsal", label: "彩排 Walkthrough" },
  { id: "gates", label: "准入 Gate" },
  { id: "meeting", label: "会议工具" },
  { id: "review", label: "决策复盘" },
];

function parseTab(raw: string | undefined): CouncilTab {
  return (TABS.find((t) => t.id === raw)?.id ?? "rehearsal") as CouncilTab;
}

const SUBTITLE: Record<CouncilTab, string> = {
  rehearsal: "总时长 90 分钟 · 6 环节 · 开会前把故事线走一遍",
  gates: "开 Invest / Innovate / Deliver 会之前的检查清单 — 输出风险项，非综合打分",
  meeting: "投票 · 表决 · 会中脉搏 → 议题 Inbox / 承诺账本",
  review: "往期决策 vs 实际 B-A 落点 — 决策质量的事后回溯",
};

export default async function CouncilPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; orgUnitId?: string; snapshotId?: string; setup?: string }>;
}) {
  const params = await searchParams;
  const tab = parseTab(params.tab);

  return (
    <div className="stratos-page">
      <PageHeader
        eyebrow="战略会闭环"
        title="战略会"
        subtitle={SUBTITLE[tab]}
      />
      <StratosTabNav
        tabs={TABS.map((t) => ({ href: `/council?tab=${t.id}`, label: t.label, active: tab === t.id }))}
      />
      {tab === "rehearsal" ? (
        <RehearsalWalkthrough
          live={await getRehearsalBundle({ orgUnitId: params.orgUnitId, snapshotId: params.snapshotId })}
          autoOpenSetup={params.setup === "1"}
        />
      ) : null}
      {tab === "gates" ? <GatesTab /> : null}
      {tab === "meeting" ? <MeetingToolsClient /> : null}
      {tab === "review" ? <DecisionReviewPanel cards={await getDecisionReviewCards()} /> : null}
    </div>
  );
}

async function GatesTab() {
  const [{ checklists, source }, fiveForces] = await Promise.all([
    getGateChecklists(),
    getFiveForceRecords(),
  ]);
  return (
    <>
      <GatesPageClient
        initialChecklists={checklists}
        initialSummary={gateSummaryFrom(checklists)}
        source={source}
      />
      <div className="mt-10 border-t border-[var(--surface-border)] pt-8">
        <FiveForcesPanel records={fiveForces.records} source={fiveForces.source} />
      </div>
    </>
  );
}
