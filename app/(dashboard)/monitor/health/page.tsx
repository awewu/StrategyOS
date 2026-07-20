import { BscConfigEditor } from "@/components/health/BscConfigEditor";
import { HealthPageClient } from "@/components/health/HealthPageClient";
import { OpsHealthDashboard } from "@/components/health/OpsHealthDashboard";
import { KpiHealthEditor } from "@/components/finance/KpiHealthEditor";
import { HealthSignalsEditor } from "@/components/health/HealthSignalsEditor";
import { ConceptGuide } from "@/components/ui/ConceptGuide";
import { PageHeader } from "@/components/ui/PageHeader";
import { getHealthBundle, getOpsHealthSeries } from "@/lib/data/strategy-data";
import { getKpiHealthMetrics } from "@/lib/fpa/kpi-health";

export default async function MonitorHealthPage() {
  const [data, opsSeries, kpiHealth] = await Promise.all([
    getHealthBundle(),
    getOpsHealthSeries(),
    getKpiHealthMetrics(),
  ]);

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
      <section className="stratos-card stratos-card--padded">
        <header className="stratos-section-header">
          <div>
            <h2 className="stratos-section-title">录入本期实际值</h2>
            <p className="stratos-section-desc">
              BSC 四灯 + 核心 KPI（可填编码 / 关联维度）· 落库即驱动指挥舱目标对比与一页纸同源信号
              {data.source === "demo" ? " · 当前为演示数据" : " · 当前为真实数据"}
            </p>
          </div>
        </header>
        <HealthSignalsEditor
          initialLights={data.bscLights}
          initialKpis={data.healthOverview.kpis.map((k) => ({
            kpiName: k.name,
            kpiValue: k.value,
            kpiTarget: k.target,
            signal: k.status,
          }))}
        />
      </section>
      <section className="stratos-card stratos-card--padded">
        <header className="stratos-section-header">
          <div>
            <h2 className="stratos-section-title">公司级 KPI 健康表</h2>
            <p className="stratos-section-desc">各项指标 · 本期 / 目标 / 同期 / 季度 / YTD / 年度 · 达成信号</p>
          </div>
        </header>
        <KpiHealthEditor bundle={kpiHealth} />
      </section>
      <ConceptGuide ids={["healthModel", "stratRobust", "vetoGate", "bsc"]} />
    </div>
  );
}
