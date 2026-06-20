import type { AarrrFunnelStage } from "@/lib/types/stratos";
import { colors } from "@/lib/brand/tokens";

export function AARRRFunnel({ stages }: { stages: AarrrFunnelStage[] }) {
  const maxCount = stages[0]?.count ?? 1;

  return (
    <section className="rounded-lg border border-[var(--stack-gtm)]/30 bg-[var(--color-bg-surface)] p-6">
      <h3 className="mb-4 text-sm font-medium" style={{ color: colors.stackGtm }}>
        AARRR 漏斗 · 哪一段漏
      </h3>
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
                className="mx-auto h-8 rounded transition-all"
                style={{
                  width: `${widthPct}%`,
                  backgroundColor: leak ? "rgba(230,81,0,0.35)" : "rgba(212,165,116,0.25)",
                  borderLeft: `3px solid ${leak ? "#8b0e04" : colors.stackGtm}`,
                }}
              />
              {s.leakNote && (
                <p className="mt-1 text-[10px] text-[#8b0e04]">⚠ {s.leakNote}</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
