import { Scoreboard4DXEditor } from "@/components/execution/Scoreboard4DXEditor";
import { buildDerivedScoreboardConfig } from "@/lib/execution/scoreboard-access";
import { VxBoardEditor } from "@/components/execution/VxBoardEditor";
import {
  TechSignalPanel,
  TrlRadarChart,
} from "@/components/execution/TechIntelPanels";
import { CynefinBadge } from "@/components/ui/CynefinBadge";
import type { getExecutionBundle } from "@/lib/data/strategy-data";
import { TensionMap } from "@/components/execution/TensionMap";
import { ExecutionMaturity } from "@/components/execution/ExecutionMaturity";
import { CommitmentLedger } from "@/components/execution/CommitmentLedger";
import { ExecutionAnalyticsEditor } from "@/components/execution/ExecutionAnalyticsEditor";
import { MarketResponsePanel } from "@/components/execution/MarketResponsePanel";
import { ReportSignalsPanel } from "@/components/execution/ReportSignalsPanel";
import { ExecutionTabs } from "@/components/execution/ExecutionTabs";
import { KpiTile } from "@/components/ui/KpiTile";
import { computeCommitmentSummary } from "@/lib/execution/commitment-summary";

type ExecData = Awaited<ReturnType<typeof getExecutionBundle>>;

export function ExecutionDashboard({
  data,
  sliceLabel,
  compact = false,
}: {
  data: ExecData;
  sliceLabel?: string;
  compact?: boolean;
}) {
  const cs = computeCommitmentSummary(data.commitments);
  const redTensions = data.tensions.filter((t) => t.severity === "high").length;

  return (
    <div className="space-y-8">
      {sliceLabel ? (
        <p className="text-caption">
          已过滤 · {sliceLabel} · 完整集团视图见{" "}
          <a href="/execution" className="text-[var(--color-accent)] hover:underline">
            执行 · 全览
          </a>
        </p>
      ) : null}
      <div className="stratos-slot-grid">
        <KpiTile
          label="承诺兑现率"
          value={cs.total > 0 ? `${cs.rate}%` : "—"}
          tone={cs.rate >= 70 ? "green" : cs.rate >= 50 ? "teal" : "red"}
          sub={`${cs.done}/${cs.total} 已兑现`}
        />
        <KpiTile
          label="逾期承诺"
          value={String(cs.overdue)}
          tone={cs.overdue > 0 ? "red" : "green"}
          sub={cs.maxDaysOverdue ? `最长 ${cs.maxDaysOverdue} 天` : "无逾期"}
        />
        <KpiTile
          label="高张力"
          value={String(redTensions)}
          tone={redTensions > 0 ? "red" : "green"}
          sub={`共 ${data.tensions.length} 项张力`}
        />
        <KpiTile
          label="领先 KR"
          value={String(data.leadingKrs.length)}
          tone="neutral"
          sub={`Vx 项目 ${data.projects.length} 个`}
        />
      </div>
      {compact ? (
        <>
          <ReportSignalsPanel signals={data.reportSignals} />
          <CommitmentLedger records={data.commitments} />
          <div className="space-y-6">
            {data.tensions.length > 0 ? <TensionMap tensions={data.tensions} /> : null}
            {data.maturityPoints.length > 0 ? <ExecutionMaturity points={data.maturityPoints} /> : null}
          </div>
        </>
      ) : (
        <ExecutionTabs
          commit={
            <div className="space-y-8">
              <CommitmentLedger records={data.commitments} />
              <TensionMap tensions={data.tensions} />
            </div>
          }
          analysis={
            <div className="space-y-8">
              <ExecutionAnalyticsEditor
                initialHorizon={data.horizonBubbles}
                initialRice={data.riceItems}
                initialTrl={data.trlRadar}
                source={data.executionAnalyticsSource}
              />
              <MarketResponsePanel responses={data.marketResponses} positions={data.competitivePositions} />
              <ExecutionMaturity points={data.maturityPoints} />
              <ReportSignalsPanel signals={data.reportSignals} />
            </div>
          }
          detail={
            <div className="space-y-8">
              <Scoreboard4DXEditor
                initialConfig={data.scoreboardConfig}
                derivedConfig={buildDerivedScoreboardConfig(data.leadingKrs)}
                objectives={data.objectives}
                allKrs={data.allKrs}
                scoreboard={data.scoreboard}
                source={data.scoreboardConfigSource}
              />
              <VxBoardEditor initialProjects={data.projects} source={data.source} />
              <div className="grid gap-6 lg:grid-cols-2">
                <TechSignalPanel signals={data.techSignals} />
                <TrlRadarChart points={data.trlRadar} />
              </div>
              <section>
                <h2 className="mb-4 text-sm font-medium text-[var(--color-text-muted)]">战略假设 Hx</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {data.assumptions.map((hx) => (
                    <div
                      key={hx.id}
                      className={`rounded-lg border bg-[var(--color-bg-surface)] p-4 ${
                        hx.result === "failed" ? "border-[var(--signal-red)]" : "border-[var(--surface-border)]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-data text-[var(--color-accent)]">{hx.code}</span>
                        <CynefinBadge domain={hx.cynefinDomain} />
                      </div>
                      <p className="mt-2 text-sm">{hx.content}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          }
        />
      )}
    </div>
  );
}
