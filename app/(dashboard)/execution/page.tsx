import { Scoreboard4DX } from "@/components/execution/Scoreboard4DX";
import { VxBoard } from "@/components/execution/VxBoard";
import { HorizonBubbleChart } from "@/components/execution/HorizonBubbleChart";
import {
  RiceScorecard,
  TechSignalPanel,
  TrlRadarChart,
} from "@/components/execution/TechIntelPanels";
import { CynefinBadge } from "@/components/ui/CynefinBadge";
import { getExecutionBundle } from "@/lib/data/strategy-data";
import { TensionMap } from "@/components/execution/TensionMap";
import { ExecutionMaturity } from "@/components/execution/ExecutionMaturity";
import { CommitmentLedger } from "@/components/execution/CommitmentLedger";
import {
  demoTensions,
  demoMaturityPoints,
  demoCommitments,
} from "@/lib/execution/tension-analysis";
import { MarketResponsePanel } from "@/components/execution/MarketResponsePanel";
import { demoMarketResponses, demoCompetitivePositions } from "@/lib/execution/market-response";

export default async function ExecutionPage() {
  const data = await getExecutionBundle();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">看执行</h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          张力分析 → 成熟度矩阵 → 承诺账本 → 执行明细 · 数据源 {data.source === "database" ? "DB" : "Demo"}
        </p>
      </div>

      {/* L0: 市场-执行对照 — 外部坐标系，空白即预警 */}
      <MarketResponsePanel responses={demoMarketResponses} positions={demoCompetitivePositions} />

      {/* L1: 战略-执行张力分析 */}
      <TensionMap tensions={demoTensions} />

      <ExecutionMaturity points={demoMaturityPoints} />

      <CommitmentLedger records={demoCommitments} />

      {/* L1: 执行明细 — 项目看板 + 4DX 操作工具 */}
      <details className="group rounded-lg border border-black/10">
        <summary className="cursor-pointer px-5 py-4 text-sm font-medium text-[var(--color-text-muted)] transition-colors group-open:text-[var(--color-text-primary)]">
          展开执行明细 · Vx 看板 · 4DX 记分板 · 假设 · TechSignal
        </summary>
        <div className="space-y-6 px-5 pb-6">
          <Scoreboard4DX diagnosis={data.diagnosis} leadingKrs={data.leadingKrs} />
          <VxBoard projects={data.projects} />
          <HorizonBubbleChart items={data.horizonBubbles} />
          <div className="grid gap-6 lg:grid-cols-2">
            <TechSignalPanel signals={data.techSignals} />
            <TrlRadarChart points={data.trlRadar} />
          </div>
          <RiceScorecard items={data.riceItems} />
          <section>
            <h2 className="mb-4 text-sm font-medium text-[var(--color-text-muted)]">战略假设 Hx</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {data.assumptions.map((hx) => (
                <div
                  key={hx.id}
                  className={`rounded-lg border bg-[var(--color-bg-surface)] p-4 ${
                    hx.result === "failed" ? "border-[var(--signal-red)]" : "border-black/10"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-data text-[var(--color-accent-gold)]">{hx.code}</span>
                    <CynefinBadge domain={hx.cynefinDomain} />
                  </div>
                  <p className="mt-2 text-sm">{hx.content}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </details>
    </div>
  );
}
