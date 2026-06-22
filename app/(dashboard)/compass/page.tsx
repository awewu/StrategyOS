import { getCompassBundle } from "@/lib/compass/data";
import { CompassClient } from "@/components/compass/CompassClient";
import { DataSourceBanner } from "@/components/ui/DataSourceBanner";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function CompassPage() {
  const bundle = await getCompassBundle();
  return (
    <div className="stratos-section-gap flex flex-col">
      <PageHeader
        eyebrow="使命 · 愿景 · 终点反推"
        title="战略罗盘"
        subtitle="从5年终极目标反推当前路径风险 · 假设前提实时审计"
      />
      <DataSourceBanner />
      <CompassClient bundle={bundle} />
    </div>
  );
}
