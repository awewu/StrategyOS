import type { ReactNode } from "react";
import { typography } from "@/lib/brand/typography";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  tone = "accent",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  /** Eyebrow color: teal accent (default) or muted. */
  tone?: "accent" | "muted";
}) {
  const eyebrowColor =
    tone === "accent" ? "text-[var(--color-accent)]" : "text-[var(--color-text-muted)]";
  return (
    <header className="stratos-page-header flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-3xl space-y-2">
        {eyebrow ? (
          <p className={`text-label ${eyebrowColor}`}>{eyebrow}</p>
        ) : null}
        <h1 className={typography.h1}>{title}</h1>
        {subtitle ? <p className={`${typography.caption} max-w-2xl`}>{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2 pb-0.5">{actions}</div> : null}
    </header>
  );
}
