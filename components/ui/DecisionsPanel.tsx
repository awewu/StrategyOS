import { appleTypography, mckinseySections } from "@/lib/brand/apple-mckinsey";
import { typography } from "@/lib/brand/typography";
import type { DecisionItem } from "@/lib/panorama/scr";

const STATUS_ZH: Record<DecisionItem["status"], string> = {
  open: "待决",
  pending: "审议中",
  closed: "已关闭",
};

export function DecisionsPanel({
  decisions,
  variant = "dark",
}: {
  decisions: DecisionItem[];
  variant?: "dark" | "print";
}) {
  if (decisions.length === 0) return null;

  const isPrint = variant === "print";

  return (
    <section
      className={
        isPrint
          ? "rounded-xl border border-[#0a1628]/10 bg-white p-5"
          : "surface-elevated rounded-xl border border-black/[0.06] p-5 md:p-6"
      }
      aria-labelledby="decisions-title"
    >
      <header className="mb-4">
        <h3
          id="decisions-title"
          className={`${appleTypography.label} ${
            isPrint ? "text-[#828c8d]" : "text-[var(--color-text-muted)]"
          }`}
        >
          {mckinseySections.decisions.id} · {mckinseySections.decisions.labelZh}
        </h3>
        <p className={`${typography.caption} mt-1`}>{mckinseySections.decisions.hint}</p>
      </header>
      <ul className="space-y-3">
        {decisions.map((d) => (
          <li
            key={d.id}
            className={`flex flex-wrap items-start justify-between gap-2 border-t ${
              isPrint ? "border-[#0a1628]/8 pt-3 first:border-0 first:pt-0" : "border-white/[0.04] pt-3 first:border-0 first:pt-0"
            }`}
          >
            <div>
              <p className={`text-sm font-medium ${isPrint ? "text-[#0a1628]" : "text-[var(--color-text-primary)]"}`}>
                {d.title}
              </p>
              {(d.owner || d.deadline) && (
                <p className={`${typography.caption} mt-1`}>
                  {[d.owner, d.deadline].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                d.status === "open"
                  ? "bg-[var(--color-accent-gold)]/15 text-[var(--color-accent-gold)]"
                  : "bg-black/[0.05] text-[var(--color-text-muted)]"
              }`}
            >
              {STATUS_ZH[d.status]}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
