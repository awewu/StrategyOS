import { PlanLifecycleBar } from "@/components/strategy/PlanLifecycleBar";
import { ChinaStrategyOnePager } from "@/components/strategy/ChinaStrategyOnePager";
import { StrategyGrowthPanel } from "@/components/strategy/StrategyGrowthPanel";
import { StrategySummaryPanel } from "@/components/strategy/StrategySummaryPanel";
import { ThreeStackPanel } from "@/components/strategy/ThreeStackPanel";
import { StrategyTabs } from "@/components/strategy/StrategyTabs";
import { GrowthAssetsEditor } from "@/components/strategy/GrowthAssetsEditor";
import { getGrowthAssetsBundle } from "@/lib/strategy/growth-assets";
import { ConceptGuide } from "@/components/ui/ConceptGuide";
import { GemPanel } from "@/components/gems/GemPanel";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCapitalSummaryLine } from "@/lib/data/entity-getters";
import { getStrategyBundle } from "@/lib/data/strategy-data";
import { getEffectiveRole } from "@/lib/auth/guard";
import { getStrategyOnePagerForViewer } from "@/lib/strategy/one-pager-store";
import { getActivePeriod } from "@/lib/data/active-period";

export default async function StrategyPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activeTab = tab === "onepager" ? ("onepager" as const) : ("view" as const);
  const role = await getEffectiveRole();
  const [bundle, onePager, capSummary, activePeriod, growthAssets] = await Promise.all([
    getStrategyBundle(),
    getStrategyOnePagerForViewer(role),
    getCapitalSummaryLine(),
    getActivePeriod(),
    getGrowthAssetsBundle().catch(() => null),
  ]);

  return (
    <div className="stratos-page">
      <PageHeader
        eyebrow="战略 · 三栈 · 一页纸"
        title="战略总览"
        subtitle={`我们的战略主张是什么 · 三栈与制胜逻辑 · ${activePeriod}`}
      />
      <GemPanel />
      <StrategyTabs active={activeTab} />
      <PlanLifecycleBar />
      {activeTab === "view" ? (
        <div className="space-y-8">
          <StrategySummaryPanel
            diagnosis={bundle.diagnosis}
            brandCards={bundle.brandCards}
            bscCards={bundle.bscCards}
            investmentCases={bundle.investmentCases}
            fpa={bundle.fpa}
            period={activePeriod}
          />
          <ThreeStackPanel
            ics={bundle.investmentCases}
            productBets={bundle.productBets}
            gtmBets={bundle.gtmBets}
            capSummary={capSummary}
          />
          <StrategyGrowthPanel bundle={bundle} />
          {growthAssets ? (
            <details className="stratos-disclosure stratos-disclosure--secondary">
              <summary>编辑增长资产 · 品牌卡 / 产品路线图 / JTBD</summary>
              <div className="stratos-disclosure__body">
                <GrowthAssetsEditor initial={growthAssets} />
              </div>
            </details>
          ) : null}
        </div>
      ) : (
        <ChinaStrategyOnePager initial={onePager} />
      )}
      <ConceptGuide
        ids={["rumelt", "playingToWin", "blm", "wuShiQiJi", "fourSatisfactions", "doctrine"]}
      />
    </div>
  );
}
