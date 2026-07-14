import type { RobustView, TwelveDimView } from "@/lib/health/robust-view";
import { pillarLabels } from "@/lib/health/twelve-dimensions";

const SIGNAL_COLOR: Record<string, string> = {
  green: "var(--signal-green)",
  yellow: "var(--signal-yellow)",
  red: "var(--signal-red)",
};

const PILLARS = ["commitment", "values", "operations"] as const;

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta == null) {
    return <span className="text-[11px] text-[var(--color-text-muted)]">上期无数据</span>;
  }
  if (delta === 0) {
    return <span className="text-[11px] text-[var(--color-text-muted)]">→ 持平</span>;
  }
  const up = delta > 0;
  return (
    <span
      className="text-[11px] font-data"
      style={{ color: up ? "var(--signal-green)" : "var(--signal-red)" }}
    >
      {up ? "▲" : "▼"} {Math.abs(delta)}
    </span>
  );
}

function DimRow({ dim }: { dim: TwelveDimView }) {
  const color = SIGNAL_COLOR[dim.signal] ?? "var(--color-accent)";
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2 text-xs">
        <span className="flex items-center gap-1.5 text-[var(--color-text-muted)]">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
          {dim.name}
        </span>
        <span className="flex items-center gap-2">
          <DeltaBadge delta={dim.delta} />
          <span className="font-data tabular-nums">{dim.score}</span>
        </span>
      </div>
      <div className="relative h-2 overflow-hidden rounded-full bg-black/[0.06]">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.min(100, Math.max(0, dim.score))}%`, backgroundColor: color }}
        />
        {dim.target != null && (
          <span
            className="absolute top-[-2px] h-3 w-0.5 bg-[var(--color-text)]"
            style={{ left: `calc(${Math.min(100, Math.max(0, dim.target))}% - 1px)` }}
            title={`目标 ${dim.target}`}
          />
        )}
      </div>
    </div>
  );
}

/**
 * StratRobust internal-trend view: 12 real dimensions with their own signals,
 * period-over-period delta, and an optional target-line tick. No fabricated
 * breakdown, no contextless single number.
 */
export function RobustTrend({ view }: { view: RobustView }) {
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3 border-b border-[var(--surface-border)] pb-3">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="font-data text-3xl font-semibold text-[var(--color-accent)]">
              {view.overall}
            </span>
            <DeltaBadge delta={view.overallDelta} />
          </div>
          <p className="text-[11px] text-[var(--color-text-muted)]">
            12 维加权综合 ·{" "}
            {view.priorPeriod ? `对比 ${view.priorPeriod}` : "暂无上期基线"}
          </p>
        </div>
        <p className="text-right text-[11px] text-[var(--color-text-muted)]">
          {view.targetsSet > 0 ? `${view.targetsSet}/12 已设目标线` : "目标线未设"}
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {PILLARS.map((pillar) => (
          <div key={pillar} className="space-y-3">
            <h4 className="text-xs text-[var(--color-accent)]">{pillarLabels[pillar]}</h4>
            <div className="space-y-3">
              {view.dims
                .filter((d) => d.pillar === pillar)
                .map((d) => (
                  <DimRow key={d.id} dim={d} />
                ))}
            </div>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-[var(--color-text-muted)]">
        阈值带 = 各维红黄绿信号 · 环比 = vs {view.priorPeriod ?? "上期（无）"} · 竖线 = 目标线
        {view.source === "demo" ? " · 演示数据" : ""}
      </p>
    </div>
  );
}
