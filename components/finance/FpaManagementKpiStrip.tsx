import Link from "next/link";
import { KpiTile, SectionCard } from "@/components/ui/KpiTile";
import type { ManagementKpis } from "@/lib/fpa/management-types";

function pct(v: number) {
  return `${(v * 100).toFixed(1)}%`;
}

export function FpaManagementKpiStrip({ kpis }: { kpis: ManagementKpis }) {
  return (
    <SectionCard
      title={`FPA 管理报表 · ${kpis.period}`}
      subtitle="ROS / EBITDA / 利润桥 — 详见财务三张表"
      action={
        <Link href="/finance" className="stratos-btn stratos-btn--ghost">
          完整管理报表 →
        </Link>
      }
    >
      <div className="stratos-slot-grid lg:grid-cols-4">
        <KpiTile
          size="hero"
          label="ROS 销售净利率"
          value={pct(kpis.rosActual)}
          sub={`B ${pct(kpis.rosBudget)} · F ${pct(kpis.rosForecast)}`}
          href="/finance"
        />
        <KpiTile
          label="EBITDA 利润率"
          value={pct(kpis.ebitdaMarginActual)}
          sub={`B ${pct(kpis.ebitdaMarginBudget)} · F ${pct(kpis.ebitdaMarginForecast)}`}
          tone="neutral"
          href="/finance"
        />
        <KpiTile
          label="EBITDA"
          value={`${Math.round(kpis.ebitdaActual)} 万`}
          sub={`B ${Math.round(kpis.ebitdaBudget)} · F ${Math.round(kpis.ebitdaForecast)}`}
          tone="neutral"
        />
        <KpiTile
          label="毛利率"
          value={pct(kpis.grossMarginActual)}
          sub={`B ${pct(kpis.grossMarginBudget)} · F ${pct(kpis.grossMarginForecast)}`}
          tone="neutral"
        />
      </div>
    </SectionCard>
  );
}
