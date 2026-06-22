import { mckinseySections } from "@/lib/brand/apple-mckinsey";
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
    ? "text-label text-[#828c8d]"
    : "label-xs";

  const resolutionClass = isPrint ? "text-[#0a1628]" : "text-[var(--color-text-primary)]";

  return (
    <section className={shell} aria-labelledby="exec-summary-title">
      <header className="stratos-section-header">
        <div>
          <h2 id="exec-summary-title" className="stratos-section-title">
            执行摘要 · SCR
          </h2>
          {!compact ? (
            <p className={`stratos-section-desc ${isPrint ? "text-[#828c8d]" : ""}`}>
              答案先行 · Resolution 占叙事主轴
            </p>
          ) : null}
        </div>
      </header>
      <dl className={`grid gap-6 ${compact ? "md:grid-cols-3 md:gap-5" : "md:grid-cols-3"}`}>
        <div className="space-y-2">
          <dt className={labelClass}>
            {mckinseySections.scr.situation.id} · {mckinseySections.scr.situation.labelZh}
          </dt>
          <dd className={`stratos-prose ${isPrint ? "text-[#4e5758]" : ""}`}>
            {scr.situation}
          </dd>
        </div>
        <div className="space-y-2">
          <dt className={labelClass}>
            {mckinseySections.scr.complication.id} · {mckinseySections.scr.complication.labelZh}
          </dt>
          <dd className={`stratos-prose font-medium ${isPrint ? "text-[#b45309]" : "text-[var(--signal-yellow)]"}`}>
            {scr.complication}
          </dd>
        </div>
        <div className="space-y-2">
          <dt className={labelClass}>
            {mckinseySections.scr.resolution.id} · {mckinseySections.scr.resolution.labelZh}
          </dt>
          <dd className={`stratos-prose font-semibold ${resolutionClass}`}>{scr.resolution}</dd>
        </div>
      </dl>
    </section>
  );
}
