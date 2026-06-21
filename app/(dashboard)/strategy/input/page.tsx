import Link from "next/link";
import { StrategyInputClient } from "@/components/strategy/StrategyInputClient";
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
    <div className="space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-[var(--color-accent-gold)]/30 bg-[var(--color-accent-gold)]/5 p-4 md:p-5">
        <div className="min-w-0 flex-1 space-y-2">
          <h2 className="text-sm font-medium text-[var(--color-accent-gold)]">
            编制前 · 历史版本 · 对照
          </h2>
          <p className="text-xs text-[var(--color-text-muted)]">
            先读 StratDiff 再更新本版战略 — 关注版本间关键变化与涌现模式
          </p>
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
        <Link
          href="/versions"
          className="shrink-0 rounded-lg border border-[var(--color-accent-gold)]/40 bg-[var(--color-bg-surface)] px-4 py-2 text-sm text-[var(--color-accent-gold)] transition-colors hover:bg-[var(--color-accent-gold)]/10"
        >
          历史版本 · 对照 →
        </Link>
      </section>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">战略录入</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            集团 · 高管层 · 执行层 三级战略规划录入与提交
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href="/versions"
            className="rounded-md border border-[var(--surface-border)] px-3 py-1.5 text-xs text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-accent-gold)]/40 hover:text-[var(--color-accent-gold)]"
          >
            历史版本对照 →
          </Link>
          <Link
            href="/admin/org"
            className="rounded-md border border-[var(--surface-border)] px-3 py-1.5 text-xs text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-accent)]/40 hover:text-[var(--color-accent)]"
          >
            管理组织架构 →
          </Link>
        </div>
      </div>
      <StrategyInputClient orgUnits={orgUnits} />
    </div>
  );
}
