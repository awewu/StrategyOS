import type { MetricSeries } from "@/lib/metrics/snapshots";

function trendHint(points: { value: number }[]): string | null {
  if (points.length < 3) return null;
  const last3 = points.slice(-3).map((p) => p.value);
  if (last3[0]! > last3[1]! && last3[1]! > last3[2]!) return "⚠ 连续三期下滑";
  if (last3[0]! < last3[1]! && last3[1]! < last3[2]!) return "↑ 连续三期上行";
  return null;
}

/** 兑现率 / Robust / BSC 红灯的期次快照趋势（数据随每期捕获自动累积） */
export function MetricTrendPanel({ series }: { series: MetricSeries[] }) {
  return (
    <div className="space-y-4">
      {series.length === 0 ? (
        <div className="stratos-card stratos-card--padded text-sm text-[var(--color-text-muted)]">
          暂无指标快照。本页每次打开会自动捕获当期兑现率 / Robust / BSC 红灯数，攒 3 期后趋势线成形。
        </div>
      ) : (
        series.map((s) => {
          const max = Math.max(1, ...s.points.map((p) => p.value));
          const hint = trendHint(s.points);
          return (
            <div key={s.metricKey} className="stratos-card stratos-card--padded">
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-sm font-semibold">{s.label} · 期次快照</h3>
                {hint ? (
                  <span
                    className="text-xs font-medium"
                    style={{ color: hint.startsWith("⚠") ? "var(--signal-red-text)" : "var(--signal-green-text)" }}
                  >
                    {hint}
                  </span>
                ) : (
                  <span className="text-caption">
                    {s.points.length} 期 · 满 3 期出趋势信号
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {s.points.map((p) => (
                  <div key={p.period} className="flex items-center gap-3 text-xs">
                    <span className="w-20 flex-shrink-0 font-mono text-[var(--color-text-muted)]">{p.period}</span>
                    <div className="h-3 flex-1 rounded bg-black/[0.05]">
                      <div
                        className="h-full rounded bg-[var(--color-accent)]/60"
                        style={{ width: `${Math.max(2, Math.round((p.value / max) * 100))}%` }}
                      />
                    </div>
                    <span className="w-20 flex-shrink-0 text-right font-mono">{p.value}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
