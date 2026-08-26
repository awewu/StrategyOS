/**
 * Badge — StratOS primitive (Track B · B0).
 *
 * Semantic tones map to L0 signal / accent / BSC tokens via color-mix tints so
 * a single component covers status chips, stack tags, and risk markers with
 * consistent contrast. Restrained by default (Claude); red reserved for risk.
 */
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/ui/cn";

export type BadgeTone =
  | "neutral"
  | "accent"
  | "green"
  | "yellow"
  | "red"
  | "violet";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-[var(--surface-raised)] text-[var(--color-text-secondary)] border border-[var(--surface-border-strong)]",
  accent:
    "text-[var(--color-accent)] border border-transparent " +
    "bg-[color-mix(in_srgb,var(--color-accent)_12%,white)]",
  green:
    "text-[var(--signal-green-text)] border border-transparent " +
    "bg-[color-mix(in_srgb,var(--signal-green)_12%,white)]",
  yellow:
    "text-[var(--signal-yellow-text)] border border-transparent " +
    "bg-[color-mix(in_srgb,var(--signal-yellow)_14%,white)]",
  red:
    "text-[var(--signal-red-text)] border border-transparent " +
    "bg-[color-mix(in_srgb,var(--signal-red)_12%,white)]",
  violet:
    "text-[var(--accent-sim)] border border-transparent " +
    "bg-[color-mix(in_srgb,var(--accent-sim)_12%,white)]",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  dot?: boolean;
}

export function Badge({ tone = "neutral", dot, className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium leading-none whitespace-nowrap",
        TONES[tone],
        className,
      )}
      {...rest}
    >
      {dot ? <span className="size-1.5 rounded-full bg-current" aria-hidden /> : null}
      {children}
    </span>
  );
}
