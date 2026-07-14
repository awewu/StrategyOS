import type { IntelSignal } from "@/lib/market-intel/types";
import { DIMENSION_LABEL, SOURCE_LABEL, leadTimeOf } from "@/lib/market-intel/types";

/**
 * Leading-indicator board. Surfaces recruitment + patent signals that precede a
 * competitor's market move by 6–12 months, so the board sees "what's coming"
 * before it shows up in product launches or financial results.
 */
export function LeadingIndicatorPanel({ signals }: { signals: IntelSignal[] }) {
  const leading = signals
    .filter((s) => leadTimeOf(s.sourceKind) === "leading")
    .sort((a, b) => b.relevance - a.relevance);

  return (
    <section className="rounded-lg border border-[var(--color-accent)]/30 bg-[var(--color-accent-dim)] p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-title">领先信号 · 提前 6–12 个月预警</h2>
          <p className="text-caption">招聘扩编与专利布局先于产品发布和财报 — 对手的下一步，藏在这里</p>
        </div>
        <span className="rounded-full bg-[var(--color-accent)] px-2.5 py-0.5 text-xs font-medium text-white">
          {leading.length} 条
        </span>
      </div>

      {leading.length === 0 ? (
        <p className="mt-4 rounded-md border border-dashed border-[var(--color-accent)]/30 p-4 text-sm text-[var(--color-text-muted)]">
          暂无领先信号。建议为核心竞品登记 <span className="font-medium text-[var(--color-accent)]">招聘信号</span> 与{" "}
          <span className="font-medium text-[var(--color-accent)]">专利</span> 来源 —— 缺失即意味着对其技术与扩产动向缺乏前瞻。
        </p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {leading.map((s) => (
            <li key={s.id} className="flex items-start gap-3 rounded-md border border-[var(--surface-border)] bg-[var(--surface-panel)] p-3">
              <span className="mt-0.5 shrink-0 rounded bg-[var(--color-accent)]/15 px-1.5 py-0.5 font-data text-xs font-semibold text-[var(--color-accent)]">
                {SOURCE_LABEL[s.sourceKind]}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-[var(--color-text-primary)]">{s.competitor}</span>
                  <span className="rounded bg-[var(--color-accent-dim)] px-1.5 py-0.5 text-xs text-[var(--color-accent)]">
                    {DIMENSION_LABEL[s.dimension]}
                  </span>
                  <span className="font-data text-caption">相关度 {s.relevance}</span>
                </div>
                <p className="mt-1 text-sm font-medium text-[var(--color-text-primary)]">{s.title}</p>
                <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">{s.summary}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
