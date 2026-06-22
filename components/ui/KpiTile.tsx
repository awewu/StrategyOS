import type { ReactNode } from "react";
import { typography } from "@/lib/brand/typography";

export function KpiTile({
  label, value, sub, tone = "gold", href,
}: {
  label: string; value: string; sub?: string;
  tone?: "gold" | "green" | "red" | "neutral"; href?: string;
}) {
  const toneClass =
    tone === "green"  ? "text-[var(--signal-green)]" :
    tone === "red"    ? "text-[var(--signal-red)]" :
    tone === "neutral"? "text-[var(--color-text-primary)]" :
                        "text-[var(--color-accent)]";

  const inner = (
    <>
      <div className="label-xs">{label}</div>
      <div className={`${typography.dataLg} mt-2 ${toneClass}`}>{value}</div>
      {sub ? <div className="mt-1.5 font-data text-xs tabular-nums text-[var(--color-text-muted)]">{sub}</div> : null}
    </>
  );

  const cls = "stratos-card stratos-card--flat stratos-card--padded block transition-colors hover:border-[var(--surface-border-strong)]";

  return href ? <a href={href} className={cls}>{inner}</a> : <div className={cls}>{inner}</div>;
}

export function SectionCard({
  title, subtitle, children, accent = "gold", action,
}: {
  title: string; subtitle?: string; children: ReactNode;
  accent?: "gold" | "sky" | "violet" | "green"; action?: ReactNode;
}) {
  const border =
    accent === "sky"    ? "border-l-sky-500" :
    accent === "violet" ? "border-l-violet-500" :
    accent === "green"  ? "border-l-[var(--signal-green)]" :
                          "border-l-[var(--color-accent)]";

  return (
    <section className={`stratos-card stratos-card--padded border-l-[3px] ${border}`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-title text-[var(--color-text-primary)]">{title}</h2>
          {subtitle ? <p className={`${typography.caption} mt-0.5`}>{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
