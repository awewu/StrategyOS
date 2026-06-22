import type { RiceItem, TechSignal, TrlRadarPoint } from "@/lib/types/stratos";

const URGENCY: Record<string, string> = {
  watch: "观察",
  act: "行动",
  invest: "投资",
};

export function TechSignalPanel({ signals }: { signals: TechSignal[] }) {
  return (
    <section className="rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-6">
      <h2 className="mb-4 text-sm font-medium text-[var(--color-accent)]">
        TechSignal · TRL 雷达
      </h2>
      <div className="space-y-3">
        {signals.map((s) => (
          <div key={s.id} className="flex flex-wrap items-center gap-3 rounded border border-[var(--surface-border)] p-3">
            <TrlBadge trl={s.trl} />
            <div className="flex-1 min-w-[200px]">
              <div className="text-sm font-medium">{s.title}</div>
              <div className="text-xs text-[var(--color-text-muted)]">
                {s.source} · {s.horizon}
                {s.linkedProjectCode && ` · ${s.linkedProjectCode}`}
              </div>
            </div>
            <span className="rounded bg-black/[0.04] px-2 py-0.5 text-xs">{URGENCY[s.urgency]}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function TrlRadarChart({ points }: { points: TrlRadarPoint[] }) {
  return (
    <section className="rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-6">
      <h3 className="mb-4 text-sm font-medium text-[var(--color-text-muted)]">TRL 能力雷达</h3>
      <div className="space-y-3">
        {points.map((p) => (
          <div key={p.domain}>
            <div className="mb-1 flex justify-between text-xs">
              <span>{p.domain}</span>
              <span className="font-data">
                {p.current} → {p.target}
              </span>
            </div>
            <div className="relative h-2 rounded-full bg-black/[0.06]">
              <div
                className="absolute h-full rounded-full bg-[var(--color-accent)]/60"
                style={{ width: `${(p.current / 9) * 100}%` }}
              />
              <div
                className="absolute top-0 h-full w-0.5 bg-black/20"
                style={{ left: `${(p.target / 9) * 100}%` }}
              />
            </div>
            {p.gapNote && (
              <p className="mt-0.5 text-[10px] text-[var(--color-text-muted)]">{p.gapNote}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export function RiceScorecard({ items }: { items: RiceItem[] }) {
  const sorted = [...items].sort((a, b) => b.score - a.score);

  return (
    <section className="rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-6">
      <h2 className="mb-4 text-sm font-medium text-[var(--color-text-muted)]">
        RICE 优先级 · 执行排序
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="text-[var(--color-text-muted)]">
            <tr>
              <th className="pb-2">举措</th>
              <th className="pb-2">R</th>
              <th className="pb-2">I</th>
              <th className="pb-2">C</th>
              <th className="pb-2">E</th>
              <th className="pb-2">Score</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((item) => (
              <tr key={item.id} className="border-t border-[var(--surface-border)]">
                <td className="py-2">
                  {item.initiative}
                  {item.linkedVx && (
                    <span className="ml-2 font-data text-xs text-[var(--color-accent)]">
                      {item.linkedVx}
                    </span>
                  )}
                </td>
                <td className="py-2 font-data">{item.reach}</td>
                <td className="py-2 font-data">{item.impact}</td>
                <td className="py-2 font-data">{item.confidence}</td>
                <td className="py-2 font-data">{item.effort}</td>
                <td className="py-2 font-data text-[var(--color-accent)]">{item.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function TrlBadge({ trl }: { trl: number }) {
  const color = trl >= 7 ? "text-emerald-400" : trl >= 4 ? "text-amber-400" : "text-[#8b0e04]";
  return (
    <div className={`flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-full border border-[var(--surface-border)] ${color}`}>
      <span className="text-[10px] opacity-70">TRL</span>
      <span className="font-data text-sm leading-none">{trl}</span>
    </div>
  );
}
