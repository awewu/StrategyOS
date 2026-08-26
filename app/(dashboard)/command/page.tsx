import Link from "next/link";
import { requireRouteAccess } from "@/lib/auth/guard";
import { PanoramaPrintLayout } from "@/components/print/PanoramaPrintLayout";
import { DownloadPdfButton } from "@/components/brand/DownloadPdfButton";
import { getInboxSummary } from "@/lib/inbox/count";
import { CommandBoardShell } from "@/components/command/CommandBoardShell";
import { CommandTabs } from "@/components/command/CommandTabs";
import { GemPanel } from "@/components/gems/GemPanel";
import { TimelineEditor } from "@/components/command/TimelineEditor";
import { DecisionsEditor } from "@/components/command/DecisionsEditor";
import { TopAlertsPanel } from "@/components/command/TopAlertsPanel";
import { ScenarioAdvisor } from "@/components/command/ScenarioAdvisor";
import { BscTargetsBoard } from "@/components/command/BscTargetsBoard";
import { BafBar } from "@/components/finance/BafBar";
import { RobustTrend } from "@/components/health/RobustTrend";
import { TrafficLightDot } from "@/components/ui/TrafficLight";
import { ExecutiveSummary } from "@/components/ui/ExecutiveSummary";
import { KpiTile, SectionCard } from "@/components/ui/KpiTile";
import { PageHeader } from "@/components/ui/PageHeader";
import { brand } from "@/lib/brand/tokens";
import { getCommandDeckBundle } from "@/lib/data/strategy-data";
import { getActivePeriod } from "@/lib/data/active-period";
import { buildScrSummary, buildTopAlerts } from "@/lib/panorama/scr";
import { topDiffs } from "@/lib/stratos";

function pct(v: number) {
  return `${(v * 100).toFixed(1)}%`;
}

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(fallback);
      },
    );
  });
}

const QUICK_LINKS = [
  { href: "/command/issues", label: "议题" },
  { href: "/strategy/input", label: "编制战略" },
  { href: "/versions", label: "历史对照" },
  { href: "/decode", label: "战略解码" },
  { href: "/strategy", label: "一页纸" },
  { href: "/finance", label: "FPA" },
  { href: "/monitor/bu", label: "事业部监测" },
  { href: "/monitor/health", label: "集团健康" },
  { href: "/strategy/outlook", label: "战略展望" },
] as const;

export default async function CommandPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireRouteAccess("/command");
  const { tab } = await searchParams;
  const activeTab = tab === "a3" ? ("a3" as const) : ("overview" as const);
  const [deck, inbox, activePeriod] = await Promise.all([
    getCommandDeckBundle(),
    withTimeout(getInboxSummary(), 2500, { open: 0, critical: 0 }),
    getActivePeriod(),
  ]);
  const bsc = deck.bsc;
  const top3 = topDiffs(deck.stratDiffs, 3);
  const scr = buildScrSummary(deck);
  const alerts = buildTopAlerts(deck);
  const kpis = deck.managementReport.kpis;

  return (
    <div className="stratos-page">
      <PageHeader
        eyebrow={`${brand.taglineZh} · ${brand.taglineEn}`}
        title="指挥舱"
        subtitle={`此刻集团态势如何 · 有什么要立即决策 · ${activePeriod}`}
        actions={
          <>
            <Link href="/command/issues" className="stratos-btn stratos-btn--ghost relative">
              议题
              {inbox.open > 0 ? (
                <span className="ml-1 inline-flex min-w-[1.125rem] items-center justify-center rounded-full bg-[var(--signal-red)] px-1.5 py-0.5 text-[0.6875rem] font-semibold text-white">
                  {inbox.open}
                </span>
              ) : null}
            </Link>
            <Link href="/command?tab=a3" className="stratos-btn stratos-btn--primary">
              董事会 A3 全景
            </Link>
            <Link href="/council?tab=rehearsal" className="stratos-btn">
              Q3 彩排
            </Link>
          </>
        }
      />

      <CommandTabs active={activeTab} />

      {activeTab === "a3" ? (
        <section id="board-a3" className="stratos-card stratos-card--padded" aria-label="董事会 A3 全景">
          <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-label text-[var(--color-accent)]">董事会 A3 全景</p>
              <p className="text-caption text-[var(--color-text-muted)]">
                与指挥舱同源的一页纸呈现 · 打印/导出前的所见即所得预览
              </p>
            </div>
            <div className="flex flex-wrap gap-2 print:hidden">
              <DownloadPdfButton />
              <Link
                href="/print/panorama"
                target="_blank"
                className="rounded border border-[var(--surface-border-strong)] px-4 py-2 text-sm"
              >
                打开打印视图 ↗
              </Link>
            </div>
          </header>
          <div
            data-theme="print"
            className="overflow-x-auto rounded-xl border border-[var(--surface-border)] bg-white p-6"
          >
            <PanoramaPrintLayout deck={deck} />
          </div>
        </section>
      ) : (
      <div className="flex flex-col gap-6">
      {/* ⓪ CEO Gem「帅」· AI 审计洞察主脊 */}
      <GemPanel />

      {/* ① 致辞 · 一句话态势 */}
      <ExecutiveSummary scr={scr} />

      {/* ①.5 BSC 红线突破 · 经营底线全局预警（KPI 阈值，非 OKR 先导） */}
      {deck.bscComparison?.anyBreached && (
        <section
          className="stratos-card stratos-card--padded border-[var(--signal-red)]/40 bg-[color-mix(in_srgb,var(--signal-red)_7%,white)]"
          aria-label="BSC 红线突破"
        >
          <div className="flex items-center gap-2">
            <TrafficLightDot signal="red" />
            <p className="text-label text-[var(--signal-red-text)]">BSC 红线突破 · 经营底线告警（需预警 / 叫停 / 绩效处理）</p>
          </div>
          <ul className="mt-2 space-y-1 text-caption">
            {deck.bscComparison.dims.flatMap((d) =>
              d.thresholds
                .filter((t) => t.breached)
                .map((t, i) => (
                  <li key={`${d.key}-${i}`} className="text-[var(--color-text-secondary)]">
                    <span className="font-medium text-[var(--color-text-primary)]">{d.dim}</span> · {t.statement}
                  </li>
                )),
            )}
          </ul>
        </section>
      )}

      {/* ② 决策 */}
      <DecisionsEditor
        initialDecisions={deck.decisions}
        derivedDecisions={deck.derivedDecisions}
        source={deck.decisionsSource}
      />

      {/* ③ 态势板 · 状态亮点 → 变化 → 预警 */}
      <CommandBoardShell>
      <section className="stratos-command-board" aria-label="指挥舱态势板">
        <div className="stratos-command-board__bsc">
          <SectionCard title="BSC 四满意" subtitle="四灯 · 点卡查看年度目标与任务规划 · 配置在集团健康" accent="green">
            <BscTargetsBoard
              lights={deck.bscLights}
              cards={deck.bscCards}
              rows={bsc.rows}
              comparison={deck.bscComparison}
              period={activePeriod}
              canEdit={false}
            />
          </SectionCard>
        </div>

        <div className="stratos-command-board__robust">
          <SectionCard title="StratRobust" subtitle="12 维稳健 · 环比趋势" accent="violet">
            <RobustTrend view={deck.robustView} />
          </SectionCard>
        </div>

        <div className="stratos-command-board__fpa">
          <SectionCard
            title="FPA 管理报表"
            subtitle={`${kpis.period} · ROS / EBITDA / 利润桥`}
            action={
              <Link href="/finance" className="text-sm text-[var(--color-accent)] hover:underline">
                完整报表 →
              </Link>
            }
          >
            <div className="stratos-slot-grid grid-cols-2">
              <KpiTile label="ROS 销售净利率" value={pct(kpis.rosActual)} sub={`B ${pct(kpis.rosBudget)} · F ${pct(kpis.rosForecast)}`} href="/finance" />
              <KpiTile label="EBITDA 利润率" value={pct(kpis.ebitdaMarginActual)} sub={`B ${pct(kpis.ebitdaMarginBudget)} · F ${pct(kpis.ebitdaMarginForecast)}`} href="/finance" />
              <KpiTile label="EBITDA" value={`${Math.round(kpis.ebitdaActual)} 万`} sub={`B ${Math.round(kpis.ebitdaBudget)} · F ${Math.round(kpis.ebitdaForecast)}`} tone="neutral" />
              <KpiTile label="Runway" value={`${deck.fpa.cashRunwayMonths} 月`} sub="现金 runway" tone={deck.fpa.cashRunwayMonths < 3 ? "red" : "green"} href="/finance?tab=overview" />
            </div>
          </SectionCard>
        </div>

        <div className="stratos-command-board__baf">
          <SectionCard title="B-A-F 闭环" subtitle="营收 · 利润 · 与 FPA 联动" accent="teal">
            <BafBar fpa={deck.fpa} />
          </SectionCard>
        </div>

        <div className="stratos-command-board__spbp">
          <SectionCard title="SPBP 情景" subtitle="Bayes 概率预览" accent="sky">
            <ScenarioAdvisor scenarios={deck.spbpScenarios} embedded />
          </SectionCard>
        </div>

        <div className="stratos-command-board__diff">
          <SectionCard title="Top3 StratDiff" subtitle="版本间关键变化" accent="teal">
            <ul className="space-y-3">
              {top3.map((d, i) => (
                <li key={i} className="flex gap-3 stratos-prose">
                  <TrafficLightDot signal={d.severity === "critical" || d.severity === "high" ? "red" : "yellow"} />
                  <span>{d.title}</span>
                </li>
              ))}
            </ul>
            <Link href="/versions" className="mt-4 inline-block text-sm text-[var(--color-accent)] hover:underline">
              查看全部 diff →
            </Link>
          </SectionCard>
        </div>

        <div className="stratos-command-board__alerts">
          <SectionCard title="Top 预警" subtitle="硬阻断 · ≤3 条" accent="green">
            <TopAlertsPanel alerts={alerts} embedded />
          </SectionCard>
        </div>
      </section>
      </CommandBoardShell>

      {/* ④ 去向 · 模块快捷跳转 */}
      <nav className="stratos-card stratos-card--padded stratos-link-row" aria-label="模块快捷跳转">
        <span className="stratos-link-row__label">深入</span>
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="stratos-btn stratos-btn--ghost px-2.5 py-1.5"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* 附录 · 折叠：里程碑编辑 + 战略资料导入 */}
      <details className="stratos-disclosure stratos-disclosure--secondary">
        <summary>里程碑与决策时间轴 · 编辑</summary>
        <div className="stratos-disclosure__body">
          <TimelineEditor
            initialMilestones={deck.timeline}
            derivedMilestones={deck.derivedTimeline}
            source={deck.timelineSource}
          />
        </div>
      </details>
      </div>
      )}
    </div>
  );
}
