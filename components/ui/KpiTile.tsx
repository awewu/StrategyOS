import type { ReactNode } from "react";
import { typography } from "@/lib/brand/typography";

export function KpiTile({
  label,
  value,
  sub,
  tone = "gold",
  href,
  size = "default",
  className = "",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "gold" | "green" | "red" | "neutral";
  href?: string;
  size?: "default" | "hero";
  className?: string;
}) {
  const toneClass =
    tone === "green"
      ? "text-[var(--signal-green)]"
      : tone === "red"
        ? "text-[var(--signal-red)]"
        : tone === "neutral"
          ? "text-[var(--color-text-primary)]"
          : "text-[var(--color-accent)]";

  const valueClass = size === "hero" ? typography.dataXl : typography.dataLg;

  const inner = (
    <div className="stratos-kpi-slot">
      <div className="label-xs">{label}</div>
      <div className={`${valueClass} mt-1 ${toneClass}`}>{value}</div>
      {sub ? <div className="stratos-kpi-slot__sub">{sub}</div> : null}
    </div>
  );

  const cls = `stratos-card stratos-card--flat stratos-card--padded block transition-colors hover:border-[var(--surface-border-strong)] ${className}`.trim();

  return href ? (
    <a href={href} className={cls}>
      {inner}
    </a>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

export function SectionCard({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  accent?: "gold" | "sky" | "violet" | "green";
  action?: ReactNode;
}) {
  return (
    <section className="stratos-card stratos-card--padded">
      <header className="stratos-section-header">
        <div>
          <h2 className="stratos-section-title">{title}</h2>
          {subtitle ? <p className="stratos-section-desc">{subtitle}</p> : null}
        </div>
        {action}
      </header>
      <div>{children}</div>
    </section>
  );
}
