import Link from "next/link";
import { StrategyInputClient } from "@/components/strategy/StrategyInputClient";
import { PageHeader } from "@/components/ui/PageHeader";
import { TrafficLightDot } from "@/components/ui/TrafficLight";
import { requireRouteAccess } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { getVersionsBundle } from "@/lib/data/versions-data";
import { topDiffs } from "@/lib/stratos";

export default async function StrategyInputPage() {
  await requireRouteAccess("/strategy/input");
  const [orgUnits, { stratDiffs }] = await Promise.all([
    prisma.orgUnit.findMany({
      orderBy: [{ level: "asc" }, { sortOrder: "asc" }],
      include: { children: true },
    }),
    getVersionsBundle(),
  ]);
  const top3 = topDiffs(stratDiffs, 3);

  return (
    <div className="stratos-section-gap flex flex-col">
      <PageHeader
        eyebrow="三级规划 · 提交审核"
        title="战略录入"
        subtitle="集团 · 高管层 · 执行层战略规划录入与提交"
        actions={
          <>
            <Link href="/versions" className="stratos-btn stratos-btn--ghost text-xs">
              历史版本
            </Link>
            <Link href="/admin/org" className="stratos-btn stratos-btn--ghost text-xs">
              组织架构
            </Link>
          </>
        }
      />

      <section className="stratos-card stratos-card--padded flex flex-wrap items-start justify-between gap-4 border-l-[3px] border-l-[var(--color-accent)]">
        <div className="min-w-0 flex-1 space-y-2">
          <h2 className="text-title text-[var(--color-text-primary)]">编制前 · StratDiff 对照</h2>
          <p className="text-caption">先读版本差异再更新本版战略</p>
          {top3.length > 0 ? (
            <ul className="space-y-1.5">
              {top3.map((d, i) => (
                <li key={`${d.category}-${i}`} className="flex items-start gap-2 text-sm">
                  <TrafficLightDot
                    signal={d.severity === "critical" || d.severity === "high" ? "red" : "yellow"}
                  />
                  <span className="line-clamp-1">{d.title}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <Link href="/versions" className="stratos-btn stratos-btn--primary text-xs">
          打开对照
        </Link>
      </section>

      <StrategyInputClient orgUnits={orgUnits} />
    </div>
  );
}
