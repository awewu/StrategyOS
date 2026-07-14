import type { KellerBrandLayer } from "@/lib/types/stratos";
import { colors } from "@/lib/brand/tokens";

export function KellerBrandPyramid({ layers }: { layers: KellerBrandLayer[] }) {
  const gaps = layers.filter((l) => l.score < l.target * 0.9);
  return (
    <section className="rounded-lg border border-[var(--stack-gtm)]/30 bg-[var(--color-bg-surface)] p-6">
      <h3 className="text-sm font-medium" style={{ color: colors.stackGtm }}>
        品牌心智金字塔（Keller）· RUUD 华东
      </h3>
      <p className="mb-4 mt-1 text-[11px] leading-relaxed text-[var(--color-text-muted)]">
        自下而上：从「先被知道」到「忠诚共鸣」，低层是高层的地基。
        条长 = 调研得分 / 目标；<span className="text-[var(--signal-yellow)]">橙色 = 距目标缺口 ≥ 10%，即心智短板</span>。
      </p>
      <div className="space-y-2">
        {[...layers].reverse().map((l) => {
          const pct = Math.round((l.score / l.target) * 100);
          const ok = l.score >= l.target * 0.9;
          return (
            <div key={l.layer} className="flex items-center gap-3">
              <div className="w-28 shrink-0 text-right text-[11px] leading-tight text-[var(--color-text-muted)]">
                L{l.layer} {l.name}
              </div>
              <div className="flex-1">
                <div className="h-6 overflow-hidden rounded bg-black/[0.04]">
                  <div
                    className="flex h-full items-center justify-end pr-2 text-[11px] font-data"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: ok ? "rgba(212,165,116,0.4)" : "rgba(230,81,0,0.35)",
                    }}
                  >
                    {l.score}/{l.target}
                  </div>
                </div>
                {l.note && (
                  <p className="mt-0.5 text-[11px] text-[var(--color-text-muted)]">{l.note}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-4 border-t border-[var(--surface-border)] pt-3 text-xs text-[var(--color-text-secondary)]">
        {gaps.length > 0 ? (
          <>结论：短板在<span className="font-medium text-[var(--signal-yellow)]">{gaps.map((l) => `「L${l.layer} ${l.name}」`).join("、")}</span>，品牌投入应先补齐低层再向上建。</>
        ) : (
          <>结论：四层均接近目标，品牌心智健康。</>
        )}
      </p>
    </section>
  );
}
