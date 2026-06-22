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
      className={isPrint ? "rounded-xl border border-[#0a1628]/10 bg-white p-5" : "stratos-card stratos-card--padded"}
      aria-labelledby="decisions-title"
    >
      <header className="stratos-section-header">
        <div>
          <h2 id="decisions-title" className="stratos-section-title">
            待决事项
          </h2>
          <p className={`stratos-section-desc ${isPrint ? "text-[#828c8d]" : ""}`}>
            董事会 / 指挥层需拍板的决策清单
          </p>
        </div>
      </header>
      <ul className="divide-y divide-[var(--surface-border)]">
        {decisions.map((d) => (
          <li key={d.id} className="flex flex-wrap items-start justify-between gap-3 py-3.5 first:pt-0 last:pb-0">
            <div>
              <p className={`text-subsection ${isPrint ? "text-[#0a1628]" : "text-[var(--color-text-primary)]"}`}>
                {d.title}
              </p>
              {(d.owner || d.deadline) ? (
                <p className={`${typography.caption} mt-1`}>
                  {[d.owner, d.deadline].filter(Boolean).join(" · ")}
                </p>
              ) : null}
            </div>
            <span
              className={`stratos-chip ${d.status === "open" ? "stratos-chip--warn" : ""}`}
            >
              {STATUS_ZH[d.status]}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
