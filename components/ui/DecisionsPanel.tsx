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
      <header className="mb-3">
        <h3 id="decisions-title" className="text-title text-[var(--color-text-primary)]">
          待决事项
        </h3>
        <p className={`${typography.caption} mt-0.5`}>董事会 / 指挥层需拍板的决策清单</p>
      </header>
      <ul className="divide-y divide-[var(--surface-border)]">
        {decisions.map((d) => (
          <li key={d.id} className="flex flex-wrap items-start justify-between gap-2 py-3 first:pt-0 last:pb-0">
            <div>
              <p className={`text-sm font-medium ${isPrint ? "text-[#0a1628]" : "text-[var(--color-text-primary)]"}`}>
                {d.title}
              </p>
              {(d.owner || d.deadline) ? (
                <p className={`${typography.caption} mt-0.5`}>
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
