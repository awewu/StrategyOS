import type { AarrrFunnelStage } from "@/lib/types/stratos";

export function AARRRFunnel({ stages }: { stages: AarrrFunnelStage[] }) {
  const maxCount = stages[0]?.count ?? 1;
  const leaks = stages.filter((s, i) => i > 0 && s.conversionPct < s.benchmarkPct);

  return (
    <section className="rounded-lg border border-[var(--stack-gtm)]/30 bg-[var(--color-bg-surface)] p-6">
      <h3 className="text-sm font-medium text-[var(--stack-gtm)]">增长漏斗（AARRR）· 哪一段在漏客户</h3>
      <p className="mb-4 mt-1 text-[11px] leading-relaxed text-[var(--color-text-muted)]">
        客户从获客到推荐逐级流失；每段标注本段转化率与行业基准。
        <span className="ml-1 text-[var(--signal-red)]">红色 = 转化低于基准，即漏点</span>。
      </p>
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
                      上一段转化 {s.conversionPct}% · 行业基准 {s.benchmarkPct}%
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
                <p className="mt-1 text-[11px] text-[var(--signal-red)]">⚠ {s.leakNote}</p>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-4 border-t border-[var(--surface-border)] pt-3 text-xs text-[var(--color-text-secondary)]">
        {leaks.length > 0 ? (
          <>结论：漏点在<span className="font-medium text-[var(--signal-red)]">{leaks.map((s) => `「${s.label}」`).join("、")}</span>，优先把资源投到这一段，而非继续加大获客。</>
        ) : (
          <>结论：各段转化均达行业基准，漏斗健康，可加大顶部获客投入。</>
        )}
      </p>
    </section>
  );
}
