import type { AarrrFunnelStage } from "@/lib/types/stratos";

export function AARRRFunnel({ stages }: { stages: AarrrFunnelStage[] }) {
  const maxCount = stages[0]?.count ?? 1;

  return (
    <section className="rounded-lg border border-[var(--stack-gtm)]/30 bg-[var(--color-bg-surface)] p-6">
      <h3 className="mb-4 text-sm font-medium text-[var(--stack-gtm)]">AARRR 漏斗 · 哪一段漏</h3>
      <div className="space-y-3">
        {stages.map((s, i) => {
          const widthPct = Math.max(20, Math.round((s.count / maxCount) * 100));
          const leak = s.conversionPct < s.benchmarkPct;
          return (
            <div key={s.stage}>
              <div className="mb-1 flex justify-between text-xs">
                <span>
                  {s.label}
                  {i > 0 && (
                    <span className="ml-2 font-data text-[var(--color-text-muted)]">
                      转化 {s.conversionPct}% · 基准 {s.benchmarkPct}%
                    </span>
                  )}
                </span>
                <span className="font-data">{s.count.toLocaleString()}</span>
              </div>
              <div
                className={`mx-auto h-8 rounded transition-all border-l-[3px] ${
                  leak
                    ? "border-l-[var(--signal-red)] bg-[color-mix(in_srgb,var(--signal-red)_35%,transparent)]"
                    : "border-l-[var(--stack-gtm)] bg-[color-mix(in_srgb,var(--stack-gtm)_25%,transparent)]"
                }`}
                style={{ width: `${widthPct}%` }}
              />
              {s.leakNote && (
                <p className="mt-1 text-[10px] text-[var(--signal-red)]">⚠ {s.leakNote}</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
