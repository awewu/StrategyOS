import type { ReactNode } from "react";
import { typography } from "@/lib/brand/typography";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  accent = "gold",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  accent?: "gold" | "white";
}) {
  return (
    <header className="mb-1 flex flex-wrap items-end justify-between gap-4 border-b border-[var(--surface-border)] pb-6">
      <div className="max-w-3xl space-y-1.5">
        {eyebrow ? (
          <p
            className={`${typography.eyebrow} ${accent === "gold" ? "text-[var(--color-accent)]" : "text-[var(--color-text-primary)]"}`}
          >
            {eyebrow}
          </p>
        ) : null}
        <h1 className={`${typography.h1} text-[var(--color-text-primary)]`}>{title}</h1>
        {subtitle ? <p className={`${typography.caption} max-w-2xl`}>{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2 pb-0.5">{actions}</div> : null}
    </header>
  );
}
