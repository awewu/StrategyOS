import { TrafficLightDot } from "@/components/ui/TrafficLight";
import { CounterfactualPanel } from "@/components/versions/CounterfactualPanel";
import { StrategyPatternPanel } from "@/components/versions/StrategyPatternPanel";
import { SnapshotFreezePanel } from "@/components/versions/SnapshotFreezePanel";
import { getVersionsBundle } from "@/lib/data/versions-data";

export default async function VersionsPage() {
  const { snapshots, stratDiffs, strategyPattern, snapshotFY25, snapshotFY26, source } =
    await getVersionsBundle();

  const mintzberg = stratDiffs.filter((d) =>
    ["EMERGENT_PATTERN", "UNREALIZED", "SERENDIPITOUS", "DELIBERATE_RATE_DROP"].includes(
      d.category
    )
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">版本库</h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          StratDiff {stratDiffs.length} 条 · diff 优先于表格 · 快照不可改 · 数据源 {source}
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {snapshots.map((s) => (
          <div
            key={s.code}
            className={`rounded-lg border p-4 ${
              s.status === "WORKING"
                ? "border-[var(--color-accent-gold)]/50 bg-[var(--color-accent-gold)]/5"
                : "border-black/10 bg-[var(--color-bg-surface)]"
            }`}
          >
            <div className="font-data text-[var(--color-accent-gold)]">{s.code}</div>
            <div className="mt-1 text-sm text-[var(--color-text-muted)]">
              刻意实现率 {s.rate}%
            </div>
            <span
              className={`mt-2 inline-block text-xs ${
                s.status === "FROZEN" ? "text-green-400" : "text-[var(--color-accent-gold)]"
              }`}
            >
              {s.status}
            </span>
          </div>
        ))}
      </section>

      <SnapshotFreezePanel />
      <CounterfactualPanel />
      <StrategyPatternPanel pattern={strategyPattern} />

      <section className="rounded-lg border border-[var(--color-accent-gold)]/30 bg-[var(--color-bg-surface)] p-6">
        <h2 className="mb-4 text-sm font-medium text-[var(--color-accent-gold)]">
          Mintzberg diff (#15–18)
        </h2>
        <ul className="space-y-3">
          {mintzberg.map((d, i) => (
            <DiffRow key={i} d={d} />
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-black/10 bg-[var(--color-bg-surface)] p-6">
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
