import Link from "next/link";
import { TrafficLightDot } from "@/components/ui/TrafficLight";
import { CounterfactualPanel } from "@/components/versions/CounterfactualPanel";
import { StrategyPatternPanel } from "@/components/versions/StrategyPatternPanel";
import { SnapshotFreezePanel } from "@/components/versions/SnapshotFreezePanel";
import { ConceptGuide } from "@/components/ui/ConceptGuide";
import { PageHeader } from "@/components/ui/PageHeader";
import { getVersionsBundle } from "@/lib/data/versions-data";
import { getActivePeriod } from "@/lib/data/active-period";

export default async function VersionsPage() {
  const { snapshots, stratDiffs, strategyPattern, snapshotFY25, snapshotFY26, source } =
    await getVersionsBundle();
  const activePeriod = await getActivePeriod();

  const mintzberg = stratDiffs.filter((d) =>
    ["EMERGENT_PATTERN", "UNREALIZED", "SERENDIPITOUS", "DELIBERATE_RATE_DROP"].includes(
      d.category
    )
  );

  return (
    <div className="stratos-page">
      <PageHeader
        eyebrow="战略制定 · 历史参照"
        title="历史版本 · 对照"
        subtitle={`编制前先读 diff — 快照对比、反事实与涌现模式，支撑本版战略更新 · StratDiff ${stratDiffs.length} 条 · 数据源 ${source}`}
        actions={
          <Link
            href="/strategy/input"
            className="rounded-xl border border-[var(--color-accent)]/35 bg-[var(--color-accent)]/8 px-4 py-2.5 text-sm text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent)]/15"
          >
            去编制战略 →
          </Link>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        {snapshots.map((s) => (
          <div
            key={s.code}
            className={`rounded-lg border p-4 ${
              s.status === "WORKING"
                ? "border-[var(--color-accent)]/50 bg-[var(--color-accent)]/5"
                : "border-[var(--surface-border)] bg-[var(--color-bg-surface)]"
            }`}
          >
            <div className="font-data text-[var(--color-accent)]">{s.code}</div>
            <div className="mt-1 text-sm text-[var(--color-text-muted)]">
              刻意实现率 {s.rate}%
            </div>
            <span
              className={`mt-2 inline-block text-xs ${
                s.status === "FROZEN" ? "text-green-400" : "text-[var(--color-accent)]"
              }`}
            >
              {s.status}
            </span>
          </div>
        ))}
      </section>

      <SnapshotFreezePanel activePeriod={activePeriod} />
      <CounterfactualPanel />
      <StrategyPatternPanel pattern={strategyPattern} />

      <section className="rounded-lg border border-[var(--color-accent)]/30 bg-[var(--color-bg-surface)] p-6">
        <h2 className="mb-4 text-sm font-medium text-[var(--color-accent)]">
          Mintzberg diff (#15–18)
        </h2>
        <ul className="space-y-3">
          {mintzberg.map((d, i) => (
            <DiffRow key={i} d={d} />
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-6">
        <h2 className="mb-4 text-sm font-medium text-[var(--color-text-muted)]">
          全部变化清单 ({stratDiffs.length})
        </h2>
        <ul className="space-y-3">
          {stratDiffs.map((d, i) => (
            <DiffRow key={i} d={d} />
          ))}
        </ul>
      </section>

      <p className="text-xs text-[var(--color-text-muted)]">
        对比：2025-FY → 2026-FY · deliberate{" "}
        {snapshotFY25.strategyPattern?.deliberateRealizationRate}% →{" "}
        {snapshotFY26.strategyPattern?.deliberateRealizationRate}%
      </p>

      <ConceptGuide ids={["mintzberg", "stratDiff", "counterfactual", "stratRobust"]} />
    </div>
  );
}

function DiffRow({
  d,
}: {
  d: { category: string; severity: string; title: string; detail?: string };
}) {
  const signal =
    d.severity === "critical" || d.severity === "high"
      ? "red"
      : d.severity === "warning" || d.severity === "medium"
        ? "yellow"
        : "green";

  return (
    <li className="flex gap-3 text-sm">
      <TrafficLightDot signal={signal} />
      <div>
        <span className="text-[var(--color-text-muted)]">[{d.category}] </span>
        {d.title}
        {d.detail && (
          <span className="block text-xs text-[var(--color-text-muted)]">{d.detail}</span>
        )}
      </div>
    </li>
  );
}
