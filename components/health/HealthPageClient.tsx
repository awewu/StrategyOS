"use client";

import Link from "next/link";
import { BscLights } from "@/components/health/BscLights";
import { BafBar } from "@/components/finance/BafBar";
import { TwelveDimEditor } from "@/components/health/TwelveDimEditor";
import { KpiTile, SectionCard } from "@/components/ui/KpiTile";
import { TrafficLightDot } from "@/components/ui/TrafficLight";
import { useRole } from "@/lib/context/role-context";
import { roleToLevel } from "@/lib/auth/permissions";
import type { HealthOverviewData } from "@/lib/data/entity-getters";
import type { FpaSummary, TrafficLight } from "@/lib/types/stratos";
import type { RobustView } from "@/lib/health/robust-view";

function countLights(lights: Record<string, TrafficLight>, tone: TrafficLight) {
  return Object.values(lights).filter((l) => l === tone).length;
}

export function HealthPageClient({
  bscLights,
  healthOverview,
  fpa,
  robustOverall,
  robustView,
  source,
  hideTitle = false,
}: {
  bscLights: {
    financial: TrafficLight;
    customer: TrafficLight;
    process: TrafficLight;
    learning: TrafficLight;
  };
  healthOverview: HealthOverviewData;
  fpa: FpaSummary;
  robustOverall: number;
  robustView: RobustView;
  source: string;
  hideTitle?: boolean;
}) {
  const { role } = useRole();
  const showTwelve = roleToLevel(role) >= 2;
  const redLights = countLights(bscLights, "red");
  const yellowLights = countLights(bscLights, "yellow");

  return (
    <div className="space-y-8">
      {!hideTitle ? (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">看健康</h1>
            <p className="text-sm text-[var(--color-text-muted)]">
              四灯独立 · {showTwelve ? "十二维下钻已开启" : "CEO 视图四维+8 KPI"} · 数据源{" "}
              {source === "database" ? "DB" : "Demo"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/finance"
              className="rounded-xl border border-[var(--surface-border)] px-3 py-1.5 text-sm text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-accent)]/35 hover:text-[var(--color-accent)]"
            >
              FPA 管理报表 →
            </Link>
            <Link
              href="/outlook"
              className="rounded-xl border border-[var(--surface-border)] px-3 py-1.5 text-sm text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-accent)]/35 hover:text-[var(--color-accent)]"
            >
              战略展望 →
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap justify-end gap-2">
          <Link
            href="/finance"
            className="rounded-xl border border-[var(--surface-border)] px-3 py-1.5 text-sm text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-accent)]/35 hover:text-[var(--color-accent)]"
          >
            FPA 管理报表 →
          </Link>
          <Link
            href="/outlook"
            className="rounded-xl border border-[var(--surface-border)] px-3 py-1.5 text-sm text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-accent)]/35 hover:text-[var(--color-accent)]"
          >
            战略展望 →
          </Link>
        </div>
      )}

      <SectionCard
        title={`健康概览 · ${healthOverview.quarter}`}
        subtitle="BSC 四灯 · Robust · FPA Runway"
        action={
          <Link href="/finance?tab=overview" className="text-sm text-[var(--color-accent)] hover:underline">
            FPA 总览 →
          </Link>
        }
      >
        <div className="stratos-slot-grid sm:grid-cols-2 xl:grid-cols-4">
          <KpiTile
            size="hero"
            label="综合参考分"
            value={String(healthOverview.score)}
            sub="非掩盖四灯"
          />
          <KpiTile
            label="StratRobust"
            value={String(robustOverall)}
            sub="战略稳健性"
            tone="neutral"
          />
          <KpiTile
            label="BSC 预警"
            value={`${redLights} 红 · ${yellowLights} 黄`}
            sub="四满意灯色"
            tone={redLights > 0 ? "red" : yellowLights > 0 ? "gold" : "green"}
          />
          <KpiTile
            label="现金 Runway"
            value={`${fpa.cashRunwayMonths} 月`}
            sub="FPA 联动"
            tone={fpa.cashRunwayMonths < 3 ? "red" : "green"}
            href="/finance?tab=overview"
          />
        </div>
      </SectionCard>

      <BscLights lights={bscLights} />

      <SectionCard title={`当期 KPI · ${healthOverview.kpis.length} 项`} dense>
        <table className="w-full text-left text-sm">
          <thead className="text-[var(--color-text-muted)]">
            <tr>
              <th className="pb-2">KPI</th>
              <th className="pb-2">目标</th>
              <th className="pb-2">实际</th>
              <th className="pb-2">灯</th>
            </tr>
          </thead>
          <tbody>
            {healthOverview.kpis.map((k) => (
              <tr key={k.name} className="border-t border-[var(--surface-border)]">
                <td className="py-2">{k.name}</td>
                <td className="py-2 text-[var(--color-text-muted)]">{k.target}</td>
                <td className="py-2">{k.value}</td>
                <td className="py-2">
                  <TrafficLightDot signal={k.status as TrafficLight} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>

      {showTwelve && <TwelveDimEditor view={robustView} canEdit={showTwelve} />}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-[var(--color-text-muted)]">B·A·F 与 FPA 联动</span>
          <Link href="/finance?tab=overview" className="text-sm text-[var(--color-accent)] hover:underline">
            FPA B-A-F 总览 →
          </Link>
        </div>
        <BafBar fpa={fpa} />
      </section>
    </div>
  );
}
