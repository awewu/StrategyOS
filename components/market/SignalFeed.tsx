import type { IntelImpact, IntelSignal } from "@/lib/market-intel/types";
import { DIMENSION_LABEL, IMPACT_LABEL, SOURCE_LABEL, VERDICT_LABEL, LEAD_TIME_LABEL, leadTimeOf } from "@/lib/market-intel/types";

const IMPACT_STYLE: Record<IntelImpact, string> = {
  threat: "border-l-[var(--signal-red)] bg-[var(--signal-red)]/[0.04]",
  opportunity: "border-l-[var(--signal-green)] bg-[var(--signal-green)]/[0.04]",
  neutral: "border-l-[var(--color-text-muted)] bg-black/[0.015]",
};

const IMPACT_BADGE: Record<IntelImpact, string> = {
  threat: "bg-[var(--signal-red)]/10 text-[var(--signal-red-text)]",
  opportunity: "bg-[var(--signal-green)]/10 text-[var(--signal-green-text)]",
  neutral: "bg-black/[0.05] text-[var(--color-text-muted)]",
};

const VERDICT_BADGE: Record<string, string> = {
  supported: "bg-[var(--signal-green)]/10 text-[var(--signal-green-text)]",
  partial: "bg-[var(--signal-yellow)]/15 text-[var(--signal-yellow-text)]",
  unsupported: "bg-[var(--signal-red)]/10 text-[var(--signal-red-text)]",
};

const LEAD_TIME_BADGE: Record<string, string> = {
  leading: "bg-[var(--color-accent)]/15 text-[var(--color-accent)]",
  coincident: "bg-black/[0.05] text-[var(--color-text-muted)]",
  lagging: "bg-[var(--color-text-muted)]/15 text-[var(--color-text-muted)]",
};

export function SignalFeed({ signals }: { signals: IntelSignal[] }) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-title">情报流 · 按相关度排序</h2>
        <span className="text-caption">{signals.length} 条信号</span>
      </div>
      <div className="space-y-3">
        {signals.map((sig) => (
          <article
            key={sig.id}
            className={`rounded-lg border border-[var(--surface-border)] border-l-[3px] p-4 ${IMPACT_STYLE[sig.impact]}`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-[var(--color-text-primary)]">{sig.competitor}</span>
              <span className="rounded bg-[var(--color-accent-dim)] px-1.5 py-0.5 text-xs text-[var(--color-accent)]">
                {DIMENSION_LABEL[sig.dimension]}
              </span>
              <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${IMPACT_BADGE[sig.impact]}`}>
                {IMPACT_LABEL[sig.impact]}
              </span>
              <span
                className={`rounded px-1.5 py-0.5 text-xs font-medium ${LEAD_TIME_BADGE[leadTimeOf(sig.sourceKind)]}`}
                title="领先=招聘/专利提前预警 · 同步=产品/GTM/品牌 · 滞后=财报确认"
              >
                {LEAD_TIME_LABEL[leadTimeOf(sig.sourceKind)]}
              </span>
              <span className="ml-auto font-data text-caption">
                相关度 {sig.relevance}
              </span>
            </div>
            <h3 className="mt-2 text-sm font-medium text-[var(--color-text-primary)]">{sig.title}</h3>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{sig.summary}</p>
            {sig.verdict && (
              <div className="mt-2 flex items-start gap-2">
                <span
                  className={`shrink-0 rounded px-1.5 py-0.5 text-[var(--type-label)] font-medium ${VERDICT_BADGE[sig.verdict] ?? ""}`}
                  title="QC 反幻觉校验：信号须有原文佐证引文"
                >
                  QC · {VERDICT_LABEL[sig.verdict]}
                </span>
                {sig.evidence && (
                  <span className="text-xs italic text-[var(--color-text-muted)] border-l-2 border-[var(--surface-border)] pl-2">
                    “{sig.evidence}”
                  </span>
                )}
              </div>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-caption">
              <span>{SOURCE_LABEL[sig.sourceKind]} · {sig.sourceLabel}</span>
              <span>抓取 {sig.capturedAt}</span>
              {sig.linkedAssumptionCode && (
                <span className="font-data text-[var(--color-accent)]">假设 {sig.linkedAssumptionCode}</span>
              )}
              {sig.linkedActionCode && (
                <span className="font-data text-[var(--color-accent)]">行动 {sig.linkedActionCode}</span>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
