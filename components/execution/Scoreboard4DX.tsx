import type { KeyResult, StrategicDiagnosis } from "@/lib/types/stratos";

export function Scoreboard4DX({
  diagnosis,
  leadingKrs,
}: {
  diagnosis: StrategicDiagnosis;
  leadingKrs: KeyResult[];
}) {
  return (
    <section className="rounded-lg border border-black/10 bg-[var(--surface-panel)] p-6">
      <div className="mb-4 text-xs uppercase tracking-wider text-[#828c8d]">4DX 记分板 · WIG</div>
      <p className="mb-4 text-lg font-medium text-[var(--color-accent)]">WIG：{diagnosis.crux}</p>
      <div className="grid gap-4 md:grid-cols-2">
        {leadingKrs.map((kr) => {
          const pct = kr.confidence ? Math.round(kr.confidence * 100) : 0;
          return (
            <div key={kr.id}>
              <div className="mb-1 flex justify-between text-sm">
                <span>{kr.title}</span>
                <span className="font-data text-[#828c8d]">
                  {kr.currentValue} / {kr.targetValue}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-black/[0.06]">
                <div
                  className="h-full rounded-full bg-sky-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="mt-1 text-xs text-[#828c8d]">领先指标 · 信心 {pct}%</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
