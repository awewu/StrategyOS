import Link from "next/link";
import { FiveYearForecast, SensitivityPanel } from "@/components/finance/FiveYearForecast";
import { ScenarioAdvisor } from "@/components/command/ScenarioAdvisor";
import { RobustTrend } from "@/components/health/RobustTrend";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/KpiTile";
import { getFinanceBundle, getRobustView, getTechSignals } from "@/lib/data/strategy-data";
import { getExecutionAnalytics } from "@/lib/fpa/execution-analytics-access";
import { TechSignalPanel, TrlRadarChart } from "@/components/execution/TechIntelPanels";
import { WhatIfSliders } from "@/components/outlook/WhatIfSliders";

const HORIZON_META = [
  { key: "H1", label: "H1 · 守成", desc: "当期主业 · 现金牛", tone: "var(--signal-green)" },
  { key: "H2", label: "H2 · 拓展", desc: "增长曲线 · 新兴业务", tone: "var(--color-accent)" },
  { key: "H3", label: "H3 · 探索", desc: "未来期权 · 禁绑年度 OKR", tone: "var(--accent-sim)" },
] as const;

export default async function OutlookPage() {
  const [data, robust, techSignals, execAnalytics] = await Promise.all([
    getFinanceBundle(),
    getRobustView(),
    getTechSignals(),
    getExecutionAnalytics(),
  ]);
  const byHorizon = data.capStack.byHorizon;

  return (
    <div className="stratos-page">
      <PageHeader
        eyebrow="前瞻"
        title="战略展望"
        subtitle="未来 3–5 年往哪走 · 外部 → 三层面 → 情景 → 轨迹 → 稳健"
        actions={
          <>
            <Link href="/finance?tab=forecast" className="stratos-btn stratos-btn--primary">
              FPA 5 年全模型
            </Link>
            <Link href="/finance?tab=scenarios" className="stratos-btn">
              SPBP 情景
            </Link>
          </>
        }
      />

      {/* ① 外部环境 · 技术前瞻 */}
      <SectionCard title="① 外部环境" subtitle="宏观 · 竞争 · 技术信号 · TRL" accent="sky">
        <p className="stratos-prose mb-5 text-sm text-[var(--color-text-secondary)]">
          外部趋势与竞争态势见 <Link href="/market" className="text-[var(--color-accent)] hover:underline">市场洞察</Link>
          （五力 / Hermes）；愿景终点与假设前提审计见 <Link href="/compass" className="text-[var(--color-accent)] hover:underline">战略罗盘</Link>。
        </p>
        <div className="grid gap-5 lg:grid-cols-2">
          <TechSignalPanel signals={techSignals} />
          <TrlRadarChart points={execAnalytics.trlRadar} />
        </div>
      </SectionCard>

      {/* ② 三层面 H1/H2/H3 */}
      <SectionCard title="② 三层面组合" subtitle="增长来源随时间的配置（CAPEX 占比）" accent="green">
        <div className="grid gap-4 sm:grid-cols-3">
          {HORIZON_META.map((h) => {
            const val = byHorizon[h.key] ?? 0;
            return (
              <div key={h.key} className="rounded-xl border border-[var(--surface-border)] bg-[var(--surface-panel)] p-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-subsection text-[var(--color-text-primary)]">{h.label}</span>
                  <span className="font-data text-xl tabular-nums" style={{ color: h.tone }}>{val}%</span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-black/[0.06]">
                  <div className="h-full rounded-full" style={{ width: `${Math.min(val, 100)}%`, backgroundColor: h.tone }} />
                </div>
                <p className="mt-2 text-caption">{h.desc}</p>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* ③ 情景推演 */}
      <SectionCard title="③ 情景推演" subtitle="SPBP 三情景 · Bayes 概率" accent="sky">
        <ScenarioAdvisor scenarios={data.spbpScenarios} embedded />
      </SectionCard>

      {/* ④ 财务轨迹（只读 · 编辑入口统一在 FPA） */}
      <SectionCard title="④ 财务轨迹" subtitle="5 年预测与敏感性 · 只读预览" accent="teal">
        <div className="mb-3 flex justify-end">
          <Link href="/finance?tab=forecast" className="stratos-btn stratos-btn--ghost text-xs">
            去 FPA 编辑 →
          </Link>
        </div>
        <div className="space-y-6">
          <FiveYearForecast rows={data.fiveYearForecast} />
          <SensitivityPanel drivers={data.sensitivityDrivers} />
        </div>
      </SectionCard>

      {/* ⑤ 稳健性 */}
      <SectionCard title="⑤ 战略稳健性" subtitle="StratRobust 12 维 · 环比趋势" accent="violet">
        <RobustTrend view={robust} />
      </SectionCard>

      {/* ⑥ what-if 推演 */}
      <SectionCard title="⑥ What-if 推演" subtitle="驱动弹性 × 滑杆 · 即时看营收/利润/Runway 冲击" accent="teal">
        <WhatIfSliders fpa={data.fpa} />
      </SectionCard>
    </div>
  );
}
