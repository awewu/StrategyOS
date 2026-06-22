"use client";

import Link from "next/link";
import { BscLights } from "@/components/health/BscLights";
import { BafBar } from "@/components/finance/BafBar";
import { TwelveDimPanel } from "@/components/health/TwelveDimPanel";
import { TrafficLightDot } from "@/components/ui/TrafficLight";
import { useRole } from "@/lib/context/role-context";
import type { HealthOverviewData } from "@/lib/data/entity-getters";
import type { FpaSummary, RobustnessDimensions, TrafficLight } from "@/lib/types/stratos";

export function HealthPageClient({
  bscLights,
  healthOverview,
  fpa,
  robustOverall,
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
  robustScore: RobustnessDimensions;
  source: string;
  hideTitle?: boolean;
}) {
  const { role } = useRole();
  const showTwelve = role === "ceo" || role === "staff" || role === "vp";

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

      <BscLights lights={bscLights} />

      <section className="rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-6">
        <div className="mb-4 flex items-baseline gap-4">
          <span className="text-xs text-[var(--color-text-muted)]">综合参考分（非掩盖四灯）</span>
          <span className="font-data text-3xl">{healthOverview.score}</span>
          <span className="text-sm text-[var(--color-text-muted)]">Robust {robustOverall}</span>
        </div>
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
                <td className="py-2 text-[#828c8d]">{k.target}</td>
                <td className="py-2">{k.value}</td>
                <td className="py-2">
                  <TrafficLightDot signal={k.status as TrafficLight} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {showTwelve && <TwelveDimPanel />}

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
