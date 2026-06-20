import { HealthPageClient } from "@/components/health/HealthPageClient";
import { OpsHealthDashboard } from "@/components/health/OpsHealthDashboard";
import { getHealthBundle } from "@/lib/data/strategy-data";

export default async function HealthPage() {
  const data = await getHealthBundle();
  return (
    <div className="space-y-10">
      <HealthPageClient
        bscLights={data.bscLights}
        healthOverview={data.healthOverview}
        fpa={data.fpa}
        robustOverall={data.robustOverall}
        robustScore={data.robustScore}
        source={data.source}
      />
      <OpsHealthDashboard />
    </div>
  );
}
