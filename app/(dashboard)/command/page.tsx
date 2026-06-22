import Link from "next/link";
import { requireRouteAccess } from "@/lib/auth/guard";
import { StrategicImportPanel } from "@/components/compiler/StrategicImportPanel";
import { getInboxSummary } from "@/lib/inbox/count";
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
  const decisions = buildDecisionItems(deck);
  const kpis = deck.managementReport.kpis;
  const hardBlock = alerts.find((a) => a.severity === "critical") ?? alerts[0];

  return (
    <div className="stratos-section-gap flex flex-col">
      <PageHeader
        eyebrow={`${brand.taglineZh} · ${brand.taglineEn}`}
        title="指挥舱"
        subtitle={`${brand.positioningZh} · 2026-Q2 · 数据源 ${deck.source === "database" ? "DB" : "Demo"}`}
        actions={
          <>
            <Link
              href="/inbox"
              className="relative rounded-xl border border-[var(--color-accent-gold)]/35 bg-[var(--color-accent-gold)]/8 px-4 py-2.5 text-sm text-[var(--color-accent-gold)] transition-colors hover:bg-[var(--color-accent-gold)]/15"
            >
              议题 Inbox
              {inbox.open > 0 ? (
                <span className="ml-2 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-[var(--signal-red)] px-1.5 py-0.5 text-[0.65rem] font-semibold text-white">
                  {inbox.open}
                </span>
              ) : null}
            </Link>
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

      <StrategicImportPanel />

      <ExecutiveSummary scr={scr} />

      {hardBlock ? (
        <section
          className="rounded-2xl border border-[var(--signal-red)]/35 bg-[var(--signal-red)]/8 px-6 py-5"
          aria-label="HardBlock"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--signal-red)]">
            HardBlock · 硬阻断
          </p>
          <div className="mt-2">
            <TopAlertsPanel alerts={[hardBlock]} embedded />
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link href="/finance?tab=overview" className="text-[var(--color-accent-gold)] hover:underline">
              FPA Runway →
            </Link>
            <Link href="/gates" className="text-[var(--color-text-muted)] hover:underline">
              Gate 准入 →
            </Link>
          </div>
        </section>
      ) : null}

      <DecisionsPanel decisions={decisions} />

      <ImplicationsBar items={implications} />

      <nav
        className="flex flex-wrap items-center gap-x-1 gap-y-2 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-panel)] px-5 py-3 text-sm"
        aria-label="模块快捷跳转"
      >
        <span className="mr-2 text-xs text-[var(--color-text-muted)]">深入查看</span>
        {QUICK_LINKS.map((link, i) => (
          <span key={link.href} className="inline-flex items-center">
            {i > 0 ? <span className="mx-2 text-[var(--color-text-muted)]">·</span> : null}
            <Link
              href={link.href}
              className="text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-accent-gold)]"
            >
              {link.label}
            </Link>
          </span>
        ))}
      </nav>

      <details className="surface-glass group rounded-2xl border border-black/[0.06] p-5 open:p-6">
        <summary className="cursor-pointer text-sm font-medium text-[var(--color-text-muted)] transition-colors group-open:text-[var(--color-text-primary)]">
          展开 · 工作流 · FPA 快照 · 全部预警
        </summary>
        <div className="mt-6 space-y-6">
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
                  className="group rounded-xl border border-[var(--surface-border)] bg-[var(--surface-panel)] px-5 py-4 transition-colors hover:border-[var(--color-accent-gold)]/40 hover:bg-[var(--color-accent-gold)]/5"
                >
                  <div className="text-sm font-medium text-[var(--color-text-primary)] group-hover:text-[var(--color-accent-gold)]">
                    {step.title}
                  </div>
                  <div className="mt-1 text-xs text-[var(--color-text-muted)]">{step.desc}</div>
                </Link>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="FPA 管理报表"
            subtitle={`${kpis.period} · ROS / EBITDA / 利润桥`}
            action={
              <Link href="/finance" className="text-sm text-[var(--color-accent-gold)] hover:underline">
                完整报表 →
              </Link>
            }
          >
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
        </div>
      </details>

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
