import { PlanLifecycleBar } from "@/components/strategy/PlanLifecycleBar";
import { StrategyPageTabs } from "@/components/strategy/StrategyPageTabs";
import { ConceptGuide } from "@/components/ui/ConceptGuide";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCapitalSummaryLine } from "@/lib/data/entity-getters";
import { getStrategyBundle } from "@/lib/data/strategy-data";
import { getEffectiveRole } from "@/lib/auth/guard";
import { getStrategyOnePagerForViewer } from "@/lib/strategy/one-pager-store";
import { getActivePeriod } from "@/lib/data/active-period";

export default async function StrategyPage() {
  const role = await getEffectiveRole();
  const [bundle, onePager, capSummary, activePeriod] = await Promise.all([
    getStrategyBundle(),
    getStrategyOnePagerForViewer(role),
    getCapitalSummaryLine(),
    getActivePeriod(),
  ]);

  return (
    <div className="stratos-page">
      <PageHeader
        eyebrow="战略 · 三栈 · 一页纸"
        title="战略总览"
        subtitle={`我们的战略主张是什么 · 三栈与制胜逻辑 · ${activePeriod}`}
      />
      <PlanLifecycleBar />
      <StrategyPageTabs
        bundle={bundle}
        onePager={onePager}
        capSummary={capSummary}
        period={activePeriod}
      />
      <ConceptGuide
        ids={["rumelt", "playingToWin", "blm", "wuShiQiJi", "fourSatisfactions", "doctrine"]}
      />
    </div>
  );
}
