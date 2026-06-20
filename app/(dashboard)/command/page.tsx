import Link from "next/link";
import { TopAlertsPanel } from "@/components/command/TopAlertsPanel";
import { ScenarioAdvisor } from "@/components/command/ScenarioAdvisor";
import { BscLights } from "@/components/health/BscLights";
import { BafBar } from "@/components/finance/BafBar";
import { RobustBars } from "@/components/health/RobustBars";
import { TrafficLightDot } from "@/components/ui/TrafficLight";
import { DecisionsPanel } from "@/components/ui/DecisionsPanel";
import { ExecutiveSummary } from "@/components/ui/ExecutiveSummary";
import { ImplicationsBar } from "@/components/ui/ImplicationsBar";
import { KpiTile, SectionCard } from "@/components/ui/KpiTile";
import { PageHeader } from "@/components/ui/PageHeader";
import { brand } from "@/lib/brand/tokens";
import { getCommandDeckBundle } from "@/lib/data/strategy-data";
import {
  buildScrSummary,
  buildTopAlerts,
  buildImplications,
  buildDecisionItems,
} from "@/lib/panorama/scr";
import { topDiffs } from "@/lib/stratos";

function pct(v: number) {
  return `${(v * 100).toFixed(1)}%`;
}

export default async function CommandPage() {
  const deck = await getCommandDeckBundle();
  const top3 = topDiffs(deck.stratDiffs, 3);
  const scr = buildScrSummary(deck);
  const alerts = buildTopAlerts(deck);
  const implications = buildImplications(deck);
  const decisions = buildDecisionItems(deck);
  const kpis = deck.managementReport.kpis;

  return (
    <div className="stratos-section-gap flex flex-col">
      <PageHeader
        eyebrow={`${brand.taglineZh} · ${brand.taglineEn}`}
        title="指挥舱"
        subtitle={`${brand.positioningZh} · 2026-Q2 · 数据源 ${deck.source === "database" ? "DB" : "Demo"}`}
        actions={
          <>
            <Link
              href="/print/panorama"
              className="rounded-xl border border-[var(--color-accent-gold)]/35 bg-[var(--color-accent-gold)]/8 px-4 py-2.5 text-sm text-[var(--color-accent-gold)] transition-colors hover:bg-[var(--color-accent-gold)]/15"
            >
              董事会一页纸
            </Link>
            <Link
              href="/rehearsal"
              className="rounded-xl border border-black/[0.06] px-4 py-2.5 text-sm text-[var(--color-text-muted)] transition-colors hover:border-black/10 hover:text-[var(--color-text-primary)]"
            >
              Q3 彩排
            </Link>
          </>
        }
      />

      <ExecutiveSummary scr={scr} />

      <SectionCard title="FPA 管理报表" subtitle={`${kpis.period} · ROS / EBITDA / 利润桥`} action={
        <Link href="/finance" className="text-sm text-[var(--color-accent-gold)] hover:underline">
          完整报表 →
        </Link>
      }>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiTile label="ROS 销售净利率" value={pct(kpis.rosActual)} sub={`B ${pct(kpis.rosBudget)} · F ${pct(kpis.rosForecast)}`} href="/finance" />
          <KpiTile label="EBITDA 利润率" value={pct(kpis.ebitdaMarginActual)} sub={`B ${pct(kpis.ebitdaMarginBudget)} · F ${pct(kpis.ebitdaMarginForecast)}`} href="/finance" />
          <KpiTile label="EBITDA" value={`${Math.round(kpis.ebitdaActual)} 万`} sub={`B ${Math.round(kpis.ebitdaBudget)} · F ${Math.round(kpis.ebitdaForecast)}`} tone="neutral" />
          <KpiTile label="Runway" value={`${deck.fpa.cashRunwayMonths} 月`} sub="现金 runway" tone={deck.fpa.cashRunwayMonths < 3 ? "red" : "green"} href="/finance?tab=overview" />
        </div>
      </SectionCard>

      <SectionCard title="Top 预警" subtitle="硬阻断 · ≤3 条" accent="green">
        <TopAlertsPanel alerts={alerts} embedded />
      </SectionCard>

      <ImplicationsBar items={implications} />

      <DecisionsPanel decisions={decisions} />

      <details className="surface-glass group rounded-2xl border border-black/[0.06] p-5 open:p-6">
        <summary className="cursor-pointer text-sm font-medium text-[var(--color-text-muted)] transition-colors group-open:text-[var(--color-text-primary)]">
          展开 · BSC · 稳健性 · StratDiff · SPBP
        </summary>
        <div className="mt-6 space-y-6">
          <BscLights lights={deck.bscLights} />
          <section className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
            <SectionCard title="StratRobust" subtitle="战略稳健性五维" accent="violet">
              <RobustBars dims={deck.robustScore} />
            </SectionCard>
            <SectionCard title="SPBP 情景" subtitle="Bayes 概率预览" accent="sky">
              <ScenarioAdvisor scenarios={deck.spbpScenarios} embedded />
            </SectionCard>
            <SectionCard title="Top3 StratDiff" subtitle="版本间关键变化" accent="gold">
              <ul className="space-y-3">
                {top3.map((d, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <TrafficLightDot signal={d.severity === "critical" || d.severity === "high" ? "red" : "yellow"} />
                    <span>{d.title}</span>
                  </li>
                ))}
              </ul>
              <Link href="/versions" className="mt-4 inline-block text-sm text-[var(--color-accent-gold)] hover:underline">
                查看全部 diff →
              </Link>
            </SectionCard>
            <SectionCard title="B-A-F 闭环" subtitle="营收 · 利润" accent="gold">
              <BafBar fpa={deck.fpa} />
            </SectionCard>
          </section>
        </div>
      </details>
    </div>
  );
}
