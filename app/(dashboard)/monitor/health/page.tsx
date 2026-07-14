import { BscConfigEditor } from "@/components/health/BscConfigEditor";
import { HealthPageClient } from "@/components/health/HealthPageClient";
import { OpsHealthDashboard } from "@/components/health/OpsHealthDashboard";
import { ConceptGuide } from "@/components/ui/ConceptGuide";
import { PageHeader } from "@/components/ui/PageHeader";
import { getHealthBundle, getOpsHealthSeries } from "@/lib/data/strategy-data";

export default async function MonitorHealthPage() {
  const [data, opsSeries] = await Promise.all([getHealthBundle(), getOpsHealthSeries()]);

  return (
    <div className="stratos-page">
      <PageHeader
        eyebrow="集团"
        title="集团健康"
        subtitle="BSC 四灯 · Robust · 当期 KPI · 十二维下钻（角色）"
      />
      <BscConfigEditor
        initialCards={data.bscCards}
        lights={data.bscLights}
        source={data.bscConfigSource}
      />
      <HealthPageClient
        bscLights={data.bscLights}
        healthOverview={data.healthOverview}
        fpa={data.fpa}
        robustOverall={data.robustOverall}
        robustView={data.robustView}
        source={data.source}
        hideTitle
      />
      <OpsHealthDashboard series={opsSeries} />
      <ConceptGuide ids={["healthModel", "stratRobust", "vetoGate", "bsc"]} />
    </div>
  );
}
