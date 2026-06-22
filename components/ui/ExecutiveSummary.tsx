import { mckinseySections } from "@/lib/brand/apple-mckinsey";
import { typography } from "@/lib/brand/typography";
import type { ScrSummary } from "@/lib/panorama/scr";

export function ExecutiveSummary({
  scr,
  variant = "dark",
  compact = false,
}: {
  scr: ScrSummary;
  variant?: "dark" | "print";
  compact?: boolean;
}) {
  const isPrint = variant === "print";
  const shell = isPrint
    ? "rounded-2xl border border-[var(--color-accent)]/40 bg-white p-6 shadow-sm"
    : "stratos-card stratos-card--padded";

  const labelClass = isPrint
    ? "text-[11px] font-medium uppercase tracking-[0.08em] text-[#828c8d]"
    : "label-xs";

  const resolutionClass = isPrint ? "text-[#0a1628]" : "text-[var(--color-text-primary)]";

  return (
    <section className={shell} aria-labelledby="exec-summary-title">
      <header className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="exec-summary-title" className="text-title text-[var(--color-text-primary)]">
          执行摘要 · SCR
        </h2>
        {!compact ? (
          <p className={`${typography.caption} ${isPrint ? "text-[#828c8d]" : ""}`}>
            答案先行 · Resolution 占叙事主轴
          </p>
        ) : null}
      </header>
      <dl className={`grid gap-5 ${compact ? "md:grid-cols-3 md:gap-4" : "md:grid-cols-3"}`}>
        <div className="space-y-1.5">
          <dt className={labelClass}>
            {mckinseySections.scr.situation.id} · {mckinseySections.scr.situation.labelZh}
          </dt>
          <dd className={`text-sm leading-relaxed text-[var(--color-text-secondary)] ${isPrint ? "text-[#cdd1d2]" : ""}`}>
            {scr.situation}
          </dd>
        </div>
        <div className="space-y-1.5">
          <dt className={labelClass}>
            {mckinseySections.scr.complication.id} · {mckinseySections.scr.complication.labelZh}
          </dt>
          <dd className={`text-sm leading-relaxed ${isPrint ? "text-[#b45309]" : "text-[var(--signal-yellow)]"}`}>
            {scr.complication}
          </dd>
        </div>
        <div className="space-y-1.5">
          <dt className={labelClass}>
            {mckinseySections.scr.resolution.id} · {mckinseySections.scr.resolution.labelZh}
          </dt>
          <dd className={`text-sm font-medium leading-relaxed ${resolutionClass}`}>{scr.resolution}</dd>
        </div>
      </dl>
    </section>
  );
}
