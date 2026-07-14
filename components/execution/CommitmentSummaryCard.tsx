import Link from "next/link";
import { computeCommitmentSummary, fulfillmentRateColor } from "@/lib/execution/commitment-summary";
import type { CommitmentRecord } from "@/lib/execution/tension-analysis";

/**
 * 监测切片里的承诺 = 体检摘要（非整块账本）。
 * 以人为中心的行动台见 /cockpit；模式分析见 /execution 承诺账本。
 */
export function CommitmentSummaryCard({
  records,
  unit,
}: {
  records: CommitmentRecord[];
  unit?: string;
}) {
  const s = computeCommitmentSummary(records);
  const q = unit ? `?unit=${encodeURIComponent(unit)}` : "";

  return (
    <section className="rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-medium text-[var(--color-text-primary)]">承诺兑现 · 摘要</h3>
        {s.total > 0 ? (
          <span className="flex items-center gap-2 text-xs">
            <span className="text-[var(--color-text-muted)]">兑现率</span>
            <span className="font-data text-lg tabular-nums" style={{ color: fulfillmentRateColor(s.rate) }}>{s.rate}%</span>
          </span>
        ) : null}
      </div>

      {s.total === 0 ? (
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          暂无匹配承诺 · OPS 月报归档后归集至此。
        </p>
      ) : (
        <div className="mt-3 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-md bg-black/[0.03] py-2">
            <div className="font-data text-lg tabular-nums text-[var(--signal-red)]">{s.overdue}</div>
            <div className="text-caption">逾期{s.maxDaysOverdue ? ` · 最长${s.maxDaysOverdue}天` : ""}</div>
          </div>
          <div className="rounded-md bg-black/[0.03] py-2">
            <div className="font-data text-lg tabular-nums text-[var(--color-accent)]">{s.inflight}</div>
            <div className="text-caption">在途</div>
          </div>
          <div className="rounded-md bg-black/[0.03] py-2">
            <div className="font-data text-lg tabular-nums text-[var(--signal-green)]">{s.done}</div>
            <div className="text-caption">已完成</div>
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-3 text-caption">
        <Link href={`/cockpit${q}`} className="text-[var(--color-accent)] hover:underline">以人看 · 坚守驾驶舱 →</Link>
        <Link href={`/execution${q}`} className="text-[var(--color-text-muted)] hover:underline">深度分析 · 承诺账本 →</Link>
      </div>
    </section>
  );
}
