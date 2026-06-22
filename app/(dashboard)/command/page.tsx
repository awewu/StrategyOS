import Link from "next/link";
import { requireRouteAccess } from "@/lib/auth/guard";
import { StrategicImportPanel } from "@/components/compiler/StrategicImportPanel";
import { getInboxSummary } from "@/lib/inbox/count";
import { CommandBoardShell } from "@/components/command/CommandBoardShell";
import { TimelineEditor } from "@/components/command/TimelineEditor";
import { DecisionsEditor } from "@/components/command/DecisionsEditor";
import { TopAlertsPanel } from "@/components/command/TopAlertsPanel";
import { ScenarioAdvisor } from "@/components/command/ScenarioAdvisor";
import { BscLights } from "@/components/health/BscLights";
import { BafBar } from "@/components/finance/BafBar";
import { RobustBars } from "@/components/health/RobustBars";
import { TrafficLightDot } from "@/components/ui/TrafficLight";
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
} from "@/lib/panorama/scr";
import { topDiffs } from "@/lib/stratos";

function pct(v: number) {
  return `${(v * 100).toFixed(1)}%`;
}

const QUICK_LINKS = [
  { href: "/inbox", label: "议题 Inbox" },
  { href: "/strategy/input", label: "编制战略" },
  { href: "/versions", label: "历史对照" },
  { href: "/decode", label: "战略解码" },
  { href: "/strategy", label: "一页纸" },
  { href: "/finance", label: "FPA" },
  { href: "/monitor/bu", label: "事业部监测" },
  { href: "/monitor/health", label: "集团健康" },
  { href: "/outlook", label: "战略展望" },
] as const;

export default async function CommandPage() {
  await requireRouteAccess("/command");
  const [deck, inbox] = await Promise.all([getCommandDeckBundle(), getInboxSummary()]);
  const top3 = topDiffs(deck.stratDiffs, 3);
  const scr = buildScrSummary(deck);
  const alerts = buildTopAlerts(deck);
  const implications = buildImplications(deck);
  const kpis = deck.managementReport.kpis;
  const hardBlock = alerts.find((a) => a.severity === "critical") ?? alerts[0];

  return (
    <div className="stratos-page">
      <PageHeader
        eyebrow={`${brand.taglineZh} · ${brand.taglineEn}`}
        title="指挥舱"
        subtitle={`${brand.positioningZh} · 2026-Q2 · 数据源 ${deck.source === "database" ? "DB" : "Demo"}`}
        actions={
          <>
            <Link href="/inbox" className="stratos-btn stratos-btn--ghost relative">
              议题 Inbox
              {inbox.open > 0 ? (
                <span className="ml-1 inline-flex min-w-[1.125rem] items-center justify-center rounded-full bg-[var(--signal-red)] px-1.5 py-0.5 text-[0.625rem] font-semibold text-white">
                  {inbox.open}
                </span>
              ) : null}
            </Link>
            <Link href="/print/panorama" className="stratos-btn stratos-btn--primary">
              董事会一页纸
            </Link>
            <Link href="/rehearsal" className="stratos-btn">
              Q3 彩排
            </Link>
          </>
        }
      />

      <details className="stratos-disclosure stratos-disclosure--secondary">
        <summary>战略资料导入 · PDF / Excel 编译</summary>
        <div className="stratos-disclosure__body">
          <StrategicImportPanel embedded />
        </div>
      </details>

      <ExecutiveSummary scr={scr} />

      {hardBlock ? (
        <section
          className="stratos-card stratos-card--padded border-[var(--signal-red)]/30 bg-[color-mix(in_srgb,var(--signal-red)_6%,white)]"
          aria-label="HardBlock"
        >
          <p className="text-label text-[var(--signal-red)]">HardBlock · 硬阻断</p>
          <div className="mt-2">
            <TopAlertsPanel alerts={[hardBlock]} embedded />
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-caption">
            <Link href="/finance?tab=overview" className="text-[var(--color-accent)] hover:underline">
              FPA Runway →
            </Link>
            <Link href="/gates" className="text-[var(--color-text-muted)] hover:underline">
              Gate 准入 →
            </Link>
          </div>
        </section>
      ) : null}

      <DecisionsEditor
        initialDecisions={deck.decisions}
        derivedDecisions={deck.derivedDecisions}
        source={deck.decisionsSource}
      />

      <ImplicationsBar items={implications} />

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

      <CommandBoardShell>
      <section className="stratos-command-board" aria-label="指挥舱态势板">
        <div className="stratos-command-board__timeline">
          <TimelineEditor
            initialMilestones={deck.timeline}
            derivedMilestones={deck.derivedTimeline}
            source={deck.timelineSource}
          />
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
            <div className="stratos-slot-grid sm:grid-cols-2 xl:grid-cols-4">
              <KpiTile label="ROS 销售净利率" value={pct(kpis.rosActual)} sub={`B ${pct(kpis.rosBudget)} · F ${pct(kpis.rosForecast)}`} href="/finance" />
              <KpiTile label="EBITDA 利润率" value={pct(kpis.ebitdaMarginActual)} sub={`B ${pct(kpis.ebitdaMarginBudget)} · F ${pct(kpis.ebitdaMarginForecast)}`} href="/finance" />
              <KpiTile label="EBITDA" value={`${Math.round(kpis.ebitdaActual)} 万`} sub={`B ${Math.round(kpis.ebitdaBudget)} · F ${Math.round(kpis.ebitdaForecast)}`} tone="neutral" />
              <KpiTile label="Runway" value={`${deck.fpa.cashRunwayMonths} 月`} sub="现金 runway" tone={deck.fpa.cashRunwayMonths < 3 ? "red" : "green"} href="/finance?tab=overview" />
            </div>
          </SectionCard>
        </div>

        <div className="stratos-command-board__baf">
          <SectionCard title="B-A-F 闭环" subtitle="营收 · 利润 · 与 FPA 联动" accent="gold">
            <BafBar fpa={deck.fpa} />
          </SectionCard>
        </div>

        <div className="stratos-command-board__bsc">
          <SectionCard title="BSC 四满意" subtitle="四灯 · 目标来自 DB" accent="green">
            <BscLights lights={deck.bscLights} cards={deck.bscCards} />
          </SectionCard>
        </div>

        <div className="stratos-command-board__robust">
          <SectionCard title="StratRobust" subtitle="战略稳健性五维" accent="violet">
            <RobustBars dims={deck.robustScore} />
          </SectionCard>
        </div>

        <div className="stratos-command-board__spbp">
          <SectionCard title="SPBP 情景" subtitle="Bayes 概率预览" accent="sky">
            <ScenarioAdvisor scenarios={deck.spbpScenarios} embedded />
          </SectionCard>
        </div>

        <div className="stratos-command-board__diff">
          <SectionCard title="Top3 StratDiff" subtitle="版本间关键变化" accent="gold">
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

        <div className="stratos-command-board__workflow">
          <SectionCard title="战略工作流" subtitle="编制 → 解码 → 一页纸">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { href: "/strategy/input", title: "编制战略", desc: "三级录入与提交" },
                { href: "/decode", title: "战略解码", desc: "BSC · X-Matrix · 反馈环" },
                { href: "/strategy", title: "一页纸", desc: "董事会战略摘要" },
              ].map((step) => (
                <Link
                  key={step.href}
                  href={step.href}
                  className="group rounded-xl border border-[var(--surface-border)] bg-[var(--surface-panel)] px-4 py-3 transition-colors hover:border-[var(--color-accent)]/35 hover:bg-[var(--color-accent)]/5"
                >
                  <div className="text-subsection text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)]">
                    {step.title}
                  </div>
                  <div className="mt-1 text-caption">{step.desc}</div>
                </Link>
              ))}
            </div>
          </SectionCard>
        </div>
      </section>
      </CommandBoardShell>
    </div>
  );
}
