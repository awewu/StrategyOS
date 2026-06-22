"use client";

import { KpiTile, SectionCard } from "@/components/ui/KpiTile";
import type { ManagementReportBundle } from "@/lib/fpa/management-types";
import { bridgeBarStyle } from "@/lib/fpa/bridge-bar-style";

function pct(v: number) {
  return `${(v * 100).toFixed(1)}%`;
}

export function ManagementReportPanel({ report }: { report: ManagementReportBundle }) {
  const { kpis, marginBridge } = report;
  const bridgeMax = Math.max(...marginBridge.map((i) => Math.abs(i.cumulative)), 1);
  const rosVs = kpis.rosActual - kpis.rosBudget;

  return (
    <div className="stratos-page">
      <SectionCard
        title={`管理报表 · ${report.period}`}
        subtitle="ROS = 净利润 ÷ 营收 · EBITDA 不含 D&A、利息、所得税"
      />

      <div className="stratos-slot-grid lg:grid-cols-4">
        <KpiTile
          className="lg:col-span-2"
          size="hero"
          label="ROS 销售净利率"
          value={pct(kpis.rosActual)}
          sub={`B ${pct(kpis.rosBudget)} · F ${pct(kpis.rosForecast)} · vs B ${rosVs >= 0 ? "+" : ""}${pct(rosVs)}`}
        />
        <KpiTile
          label="EBITDA 利润率"
          value={pct(kpis.ebitdaMarginActual)}
          sub={`B ${pct(kpis.ebitdaMarginBudget)} · F ${pct(kpis.ebitdaMarginForecast)}`}
          tone="neutral"
        />
        <KpiTile
          label="毛利率"
          value={pct(kpis.grossMarginActual)}
          sub={`B ${pct(kpis.grossMarginBudget)} · F ${pct(kpis.grossMarginForecast)}`}
          tone="neutral"
        />
      </div>

      <SectionCard title="利润桥（Actual · 万元）" subtitle="累计至当期实际">
        <div className="space-y-2">
          {marginBridge.map((item) => {
            const isTotal = item.label.startsWith("=");
            const barW = `${Math.round((Math.abs(item.cumulative) / bridgeMax) * 100)}%`;
            return (
              <div key={item.label} className="space-y-0.5">
                <div className="flex items-center justify-between text-caption">
                  <span className={isTotal ? "font-medium text-[var(--color-text-primary)]" : ""}>
                    {item.label}
                  </span>
                  <span className={`font-data ${isTotal ? "text-[var(--color-accent)]" : "text-[var(--color-text-secondary)]"}`}>
                    {Math.round(item.cumulative)}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-black/[0.04]">
                  <div
                    className="h-full rounded-full"
                    style={{ width: barW, background: bridgeBarStyle(item) }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <p className="stratos-section-desc mt-4">
          ROS Actual = {pct(kpis.rosActual)} · 详见「三张表」Tab
        </p>
      </SectionCard>
    </div>
  );
}
