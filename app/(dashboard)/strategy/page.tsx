import { PlanLifecycleBar } from "@/components/strategy/PlanLifecycleBar";
import { StrategyPageTabs } from "@/components/strategy/StrategyPageTabs";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCapitalSummaryLine } from "@/lib/data/entity-getters";
import { getStrategyBundle } from "@/lib/data/strategy-data";
import { getEffectiveRole } from "@/lib/auth/guard";
import { getStrategyOnePagerForViewer } from "@/lib/strategy/one-pager-store";
import { CURRENT_PERIOD } from "@/lib/stratos-demo-data";

export default async function StrategyPage() {
  const role = await getEffectiveRole();
  const [bundle, onePager, capSummary] = await Promise.all([
    getStrategyBundle(),
    getStrategyOnePagerForViewer(role),
    getCapitalSummaryLine(),
  ]);

  return (
    <div className="stratos-page">
      <PageHeader
        eyebrow="战略 · 三栈 · 一页纸"
        title="战略总览"
        subtitle={`${CURRENT_PERIOD} · 数据源 ${bundle.source === "database" ? "DB" : "Demo"}`}
      />
      <PlanLifecycleBar />
      <StrategyPageTabs
        bundle={bundle}
        onePager={onePager}
        capSummary={capSummary}
        period={CURRENT_PERIOD}
      />
    </div>
  );
}
