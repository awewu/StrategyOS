import type { KellerBrandLayer } from "@/lib/types/stratos";
import { colors } from "@/lib/brand/tokens";

export function KellerBrandPyramid({ layers }: { layers: KellerBrandLayer[] }) {
  return (
    <section className="rounded-lg border border-[var(--stack-gtm)]/30 bg-[var(--color-bg-surface)] p-6">
      <h3 className="mb-4 text-sm font-medium" style={{ color: colors.stackGtm }}>
        Keller 品牌金字塔 · RUUD 华东
      </h3>
      <div className="space-y-2">
        {[...layers].reverse().map((l) => {
          const pct = Math.round((l.score / l.target) * 100);
          const ok = l.score >= l.target * 0.9;
          return (
            <div key={l.layer} className="flex items-center gap-3">
              <div className="w-28 shrink-0 text-right text-[10px] text-[var(--color-text-muted)]">
                L{l.layer} {l.name.split(" ")[0]}
              </div>
              <div className="flex-1">
                <div className="h-6 overflow-hidden rounded bg-black/[0.04]">
                  <div
                    className="flex h-full items-center justify-end pr-2 text-[10px] font-data"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: ok ? "rgba(212,165,116,0.4)" : "rgba(230,81,0,0.35)",
                    }}
                  >
                    {l.score}/{l.target}
                  </div>
                </div>
                {l.note && (
                  <p className="mt-0.5 text-[10px] text-[var(--color-text-muted)]">{l.note}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
