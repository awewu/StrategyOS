import type { CompetitorTrack, IntelDimension } from "@/lib/market-intel/types";
import { DIMENSION_LABEL } from "@/lib/market-intel/types";

const DIMS: IntelDimension[] = ["product", "gtm", "brand", "strategy"];

const MOMENTUM = {
  up: { label: "↑ 活跃", cls: "text-[var(--signal-red)]" },
  down: { label: "↓ 收敛", cls: "text-[var(--signal-green)]" },
  flat: { label: "→ 平稳", cls: "text-[var(--color-text-muted)]" },
} as const;

export function CompetitorMatrix({ tracks }: { tracks: CompetitorTrack[] }) {
  return (
    <section className="overflow-hidden rounded-lg border border-[var(--surface-border)] bg-[var(--surface-panel)]">
      <div className="flex items-center justify-between border-b border-[var(--surface-border)] px-5 py-3">
        <h2 className="text-title">竞品追踪矩阵</h2>
        <span className="text-caption">空白格 = 该维度盲区，对手在此处的动作未被把控</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--surface-border)] text-[var(--color-text-muted)]">
              <th className="px-5 py-2.5 font-medium">对手</th>
              {DIMS.map((d) => (
                <th key={d} className="px-4 py-2.5 font-medium">
                  {DIMENSION_LABEL[d]}
                </th>
              ))}
              <th className="px-4 py-2.5 font-medium">态势</th>
            </tr>
          </thead>
          <tbody>
            {tracks.map((t) => (
              <tr key={t.competitor} className="border-b border-[var(--surface-border)] align-top last:border-0">
                <td className="px-5 py-3 font-medium text-[var(--color-text-primary)]">{t.competitor}</td>
                {DIMS.map((d) => (
                  <td key={d} className="px-4 py-3">
                    {t[d] ? (
                      <span className="text-[var(--color-text-secondary)]">{t[d]}</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded bg-[var(--color-accent-dim)] px-1.5 py-0.5 text-xs text-[var(--color-accent)]">
                        盲区
                      </span>
                    )}
                  </td>
                ))}
                <td className="px-4 py-3">
                  <div className={`text-xs font-medium ${MOMENTUM[t.momentum].cls}`}>
                    {MOMENTUM[t.momentum].label}
                  </div>
                  <div className="mt-1 text-caption max-w-[220px]">{t.momentumNote}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
