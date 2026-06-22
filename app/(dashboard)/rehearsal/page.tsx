import { RehearsalWalkthrough } from "@/components/rehearsal/RehearsalWalkthrough";
import { PageHeader } from "@/components/ui/PageHeader";
import { getRehearsalBundle } from "@/lib/data/strategy-data";

export default async function RehearsalPage() {
  const live = await getRehearsalBundle();
  return (
    <div className="stratos-page">
      <PageHeader
        eyebrow="2026 Q3 · 战略会标准包"
        title="彩排 Walkthrough"
        subtitle={`总时长 90 分钟 · 6 环节 · 数据源 ${live.source === "database" ? "DB" : "Demo"}`}
      />
      <RehearsalWalkthrough live={live} />
    </div>
  );
}
