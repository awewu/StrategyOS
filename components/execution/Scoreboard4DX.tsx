import type { ResolvedScoreboard } from "@/lib/execution/scoreboard-access";
import type { KeyResult } from "@/lib/types/stratos";
import { SectionCard } from "@/components/ui/KpiTile";

function KrProgressBar({ kr }: { kr: KeyResult }) {
  const pct = kr.confidence ? Math.round(kr.confidence * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span>{kr.title}</span>
        <span className="font-data text-[var(--color-text-muted)]">
          {kr.currentValue} / {kr.targetValue}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-black/[0.06]">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: "var(--chart-progress)" }}
        />
      </div>
      <div className="mt-1 text-caption">信心 {pct}%</div>
    </div>
  );
}

export function Scoreboard4DX({ scoreboard }: { scoreboard: ResolvedScoreboard }) {
  return (
    <SectionCard title="4DX 记分板" accent="gold" dense>
      <p className="mb-4 text-subsection font-medium text-[var(--color-accent)]">WIG：{scoreboard.wigLabel}</p>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-secondary)]">
            领先指标
          </h3>
          {scoreboard.leadingKrs.map((kr) => (
            <KrProgressBar key={kr.id} kr={kr} />
          ))}
        </div>
        {scoreboard.laggingKrs.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-secondary)]">
              滞后指标
            </h3>
            {scoreboard.laggingKrs.map((kr) => (
              <KrProgressBar key={kr.id} kr={kr} />
            ))}
          </div>
        ) : null}
      </div>
    </SectionCard>
  );
}
