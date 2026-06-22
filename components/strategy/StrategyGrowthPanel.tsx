import { GrowthAnalyticsEditor } from "@/components/strategy/GrowthAnalyticsEditor";
import { SectionCard } from "@/components/ui/SectionCard";
import { labelFor } from "@/lib/brand/display-labels";
import type { getStrategyBundle } from "@/lib/data/strategy-data";

type StrategyBundle = Awaited<ReturnType<typeof getStrategyBundle>>;

const LANE_LABEL: Record<string, string> = {
  now: "Now",
  next: "Next",
  later: "Later",
};

export function StrategyGrowthPanel({ bundle }: { bundle: StrategyBundle }) {
  const { productRoadmap, jtbdCards, productGaps, gtmSegments } = bundle;

  return (
    <div className="stratos-section-gap flex flex-col">
      <header className="stratos-section-header">
        <div>
          <p className="stratos-section-header__eyebrow">Prod / Gtm · 增长深度</p>
          <h2 className="stratos-section-header__title">产品与市场增长视图</h2>
          <p className="stratos-section-header__subtitle">
            AARRR 漏斗 · Keller 品牌 · 路线图 · JTBD · 竞品差距 · {labelFor("gtmBets")}细分
          </p>
        </div>
      </header>

      <GrowthAnalyticsEditor
        initialAarrr={bundle.aarrrFunnel}
        initialKeller={bundle.kellerBrandLayers}
        source={bundle.growthAnalyticsSource}
      />

      <SectionCard title="产品路线图" subtitle="Now / Next / Later · 与 Vx 联动">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {productRoadmap.map((item, i) => (
            <div
              key={`${item.milestone}-${i}`}
              className="stratos-kpi-slot rounded-lg border border-[var(--surface-border)] p-4"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                {LANE_LABEL[item.lane] ?? item.lane}
              </p>
              <p className="mt-1 text-sm font-medium text-[var(--color-text-primary)]">
                {item.milestone}
              </p>
              <p className="mt-1 font-data text-xs text-[var(--color-text-muted)]">{item.quarter}</p>
              {"product" in item && item.product ? (
                <p className="mt-1 text-xs text-[var(--stack-product)]">{item.product}</p>
              ) : null}
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="JTBD · 待办任务" subtitle="客户 Jobs-to-be-Done">
          <ul className="space-y-3">
            {jtbdCards.map((card) => (
              <li
                key={`${card.product}-${card.segment}`}
                className="rounded-lg border border-[var(--surface-border)] p-4"
              >
                <p className="text-xs font-medium text-[var(--stack-product)]">{card.product}</p>
                <p className="mt-2 text-sm text-[var(--color-text-primary)]">{card.statement}</p>
                <p className="mt-2 text-xs text-[var(--color-text-muted)]">细分 · {card.segment}</p>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="竞品产品差距" subtitle="维度 · 追赶路径">
          <ul className="space-y-2">
            {productGaps.map((gap, i) => (
              <li
                key={`${gap.competitor}-${gap.dimension}-${i}`}
                className="flex items-center justify-between rounded-lg border border-[var(--surface-border)] px-4 py-3 text-sm"
              >
                <span>
                  <span className="font-medium">{gap.competitor}</span>
                  <span className="text-[var(--color-text-muted)]"> · {gap.dimension}</span>
                </span>
                <span
                  className={`text-xs font-medium ${
                    gap.status === "lagging"
                      ? "text-[var(--signal-red)]"
                      : gap.status === "leading"
                        ? "text-[var(--signal-green)]"
                        : "text-[var(--signal-yellow)]"
                  }`}
                >
                  {gap.status === "lagging" ? "落后" : gap.status === "leading" ? "领先" : "持平"}
                  {gap.closure ? ` · ${gap.closure}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <SectionCard title="GTM 细分" subtitle="覆盖 · LTV/CAC · 优先级">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--surface-border)] text-left text-xs text-[var(--color-text-muted)]">
                <th className="pb-2 pr-4 font-medium">代码</th>
                <th className="pb-2 pr-4 font-medium">细分</th>
                <th className="pb-2 pr-4 font-medium">优先级</th>
                <th className="pb-2 pr-4 font-medium">覆盖</th>
                <th className="pb-2 font-medium">LTV/CAC</th>
              </tr>
            </thead>
            <tbody>
              {gtmSegments.map((seg) => (
                <tr key={seg.code} className="border-b border-[var(--surface-border)]/60">
                  <td className="py-2.5 pr-4 font-data text-xs">{seg.code}</td>
                  <td className="py-2.5 pr-4">{seg.name}</td>
                  <td className="py-2.5 pr-4">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        seg.priority === "focus"
                          ? "bg-[var(--stack-gtm)]/15 text-[var(--stack-gtm)]"
                          : "bg-black/[0.04] text-[var(--color-text-muted)]"
                      }`}
                    >
                      {seg.priority === "focus" ? "聚焦" : "探索"}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 font-data text-xs">{seg.coverage}</td>
                  <td className="py-2.5 font-data text-xs">{seg.ltvCac}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
