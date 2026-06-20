import type { RobustnessDimensions } from "@/lib/types/stratos";
import {
  ROBUST_LABELS,
  ROBUST_WEIGHTS,
  computeRobustOverall,
} from "@/lib/stratos/robust-score";

export function RobustBars({
  dims,
  showWeights = true,
}: {
  dims: RobustnessDimensions;
  showWeights?: boolean;
}) {
  const overall = computeRobustOverall(dims);
  const entries = Object.entries(dims) as Array<[keyof RobustnessDimensions, number]>;

  return (
    <div className="space-y-3">
      {entries.map(([key, value]) => (
        <div key={key}>
          <div className="mb-1 flex justify-between text-xs text-[var(--color-text-muted)]">
            <span>
              {ROBUST_LABELS[key]}
              {showWeights && (
                <span className="ml-1 opacity-60">
                  ({Math.round(ROBUST_WEIGHTS[key] * 100)}%)
                </span>
              )}
            </span>
            <span className="font-data">{value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-black/[0.06]">
            <div
              className="h-full rounded-full bg-[var(--color-accent-gold)]"
              style={{ width: `${value}%` }}
            />
          </div>
        </div>
      ))}
      <div className="pt-2 text-center font-data text-3xl font-semibold text-[var(--color-accent-gold)]">
        {overall}
      </div>
      <p className="text-center text-[10px] text-[var(--color-text-muted)]">
        R1–R6 加权综合 · 含学习稳健性
      </p>
    </div>
  );
}
