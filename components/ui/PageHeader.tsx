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
    <header className="flex flex-wrap items-end justify-between gap-6 border-b border-black/[0.06] pb-8">
      <div className="max-w-3xl space-y-2">
        {eyebrow && (
          <p className={`${typography.h3} ${accent === "gold" ? "text-[var(--color-accent-gold)]" : "text-[var(--color-text-primary)]"}`}>
            {eyebrow}
          </p>
        )}
        <h1 className={`${typography.h1} text-[var(--color-text-primary)]`}>{title}</h1>
        {subtitle && <p className={`${typography.caption} mt-2 max-w-2xl`}>{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
