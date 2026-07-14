import type { StrategyPattern } from "@/lib/types/stratos";

export function StrategyPatternPanel({ pattern }: { pattern: StrategyPattern }) {
  return (
    <section className="rounded-lg border border-[var(--color-accent)]/30 bg-[var(--color-bg-surface)] p-6">
      <h2 className="mb-4 text-sm font-medium text-[var(--color-accent)]">
        Mintzberg · StrategyPattern
      </h2>
      <p className="mb-4 font-data text-sm">
        刻意实现率 deliberate_realization_rate:{" "}
        <span className="text-[var(--signal-red)]">{pattern.deliberateRealizationRate}%</span>
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <h3 className="mb-2 text-caption">涌现 emergent</h3>
          <ul className="space-y-1 text-sm">
            {pattern.emergentPatterns.map((e) => (
              <li key={e.title}>· {e.title}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-2 text-caption">未实现 unrealized</h3>
          <ul className="space-y-1 text-sm">
            {pattern.unrealizedItems.map((u) => (
              <li key={u.title}>· {u.title}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-2 text-caption">偶成 serendipitous</h3>
          <ul className="space-y-1 text-sm">
            {pattern.serendipitousItems.map((s) => (
              <li key={s.title}>· {s.title}</li>
            ))}
          </ul>
        </div>
      </div>
      {pattern.learningPrompts.length > 0 && (
        <div className="mt-4 text-sm italic text-[var(--color-text-muted)]">
          {pattern.learningPrompts.join(" · ")}
        </div>
      )}
    </section>
  );
}
