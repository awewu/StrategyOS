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
                        "text-[var(--color-accent-gold)]";

  const inner = (
    <>
      <div className={typography.h3}>{label}</div>
      <div className={`${typography.dataLg} mt-3 ${toneClass}`}>{value}</div>
      {sub && <div className="mt-2 font-data text-[0.7rem] tabular-nums text-[var(--color-text-muted)]">{sub}</div>}
    </>
  );

  const cls = "rounded-xl border border-[var(--surface-border)] bg-[var(--surface-panel)] px-5 py-4 transition-colors duration-150 hover:border-[var(--surface-border-strong)]";

  return href ? <a href={href} className={cls}>{inner}</a> : <div className={cls}>{inner}</div>;
}

export function SectionCard({
  title, subtitle, children, accent = "gold", action,
}: {
  title: string; subtitle?: string; children: ReactNode;
  accent?: "gold" | "sky" | "violet" | "green"; action?: ReactNode;
}) {
  const border =
    accent === "sky"    ? "border-l-sky-400" :
    accent === "violet" ? "border-l-violet-400" :
    accent === "green"  ? "border-l-[var(--signal-green)]" :
                          "border-l-[var(--color-accent-gold)]";

  return (
    <section className={`rounded-xl border border-[var(--surface-border)] bg-[var(--surface-panel)] ${border} border-l-[2px] px-6 py-5`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className={typography.h2}>{title}</h2>
          {subtitle && <p className={`${typography.caption} mt-0.5`}>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
