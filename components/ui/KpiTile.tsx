import type { ReactNode } from "react";
import { typography } from "@/lib/brand/typography";

export function KpiDelta({
  value,
  label,
  higherIsBetter = true,
}: {
  value: number;
  label?: string;
  higherIsBetter?: boolean;
}) {
  if (value === 0) {
    return <span className="text-caption">→ 持平{label ? ` · ${label}` : ""}</span>;
  }
  const up = value > 0;
  const good = up === higherIsBetter;
  return (
    <span
      className="font-data text-[11px]"
      style={{ color: good ? "var(--signal-green)" : "var(--signal-red)" }}
    >
      {up ? "▲" : "▼"} {Math.abs(value)}
      {label ? ` · ${label}` : ""}
    </span>
  );
}

export function KpiTile({
  label,
  value,
  sub,
  delta,
  tone = "teal",
  href,
  size = "default",
  className = "",
}: {
  label: string;
  value: string;
  sub?: string;
  delta?: { value: number; label?: string; higherIsBetter?: boolean };
  tone?: "teal" | "green" | "red" | "neutral";
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
      {delta ? (
        <div className="mt-0.5">
          <KpiDelta value={delta.value} label={delta.label} higherIsBetter={delta.higherIsBetter} />
        </div>
      ) : null}
      {sub ? <div className="stratos-kpi-slot__sub">{sub}</div> : null}
    </div>
  );

  const cls = `stratos-card stratos-card--flat stratos-kpi-tile block transition-colors hover:border-[var(--surface-border-strong)] ${className}`.trim();

  return href ? (
    <a href={href} className={cls}>
      {inner}
    </a>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

const SECTION_ACCENT: Record<string, string> = {
  teal: "var(--color-accent)",
  sky: "var(--ruud-cyan, var(--color-accent))",
  violet: "var(--accent-sim, #6d3fc0)",
  green: "var(--signal-green)",
};

export function SectionCard({
  title,
  subtitle,
  children,
  accent,
  action,
  footer,
  dense = false,
  id,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  accent?: "teal" | "sky" | "violet" | "green";
  action?: ReactNode;
  footer?: ReactNode;
  dense?: boolean;
  id?: string;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={`stratos-card stratos-card--padded ${dense ? "stratos-card--dense" : ""} ${className}`.trim()}
    >
      <header className={`stratos-section-header ${dense ? "stratos-section-header--dense" : ""}`.trim()}>
        <div>
          <h2 className="stratos-section-title">
            {accent ? (
              <span
                aria-hidden
                className="stratos-section-title__dot"
                style={{ backgroundColor: SECTION_ACCENT[accent] }}
              />
            ) : null}
            {title}
          </h2>
          {subtitle ? <p className="stratos-section-desc">{subtitle}</p> : null}
        </div>
        {action}
      </header>
      <div>{children}</div>
      {footer ? <footer className="stratos-section-footer">{footer}</footer> : null}
    </section>
  );
}
