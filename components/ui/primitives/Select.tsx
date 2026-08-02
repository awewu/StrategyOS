"use client";

/**
 * Select — StratOS primitive (Track B · B1).
 *
 * Native <select> restyled to match Input, with a token-bound chevron drawn
 * inline (no icon dependency). Keeps native keyboard/a11y semantics.
 */
import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/ui/cn";

export type SelectSize = "xs" | "sm" | "md";
export type SelectTone = "elevated" | "subtle" | "surface";
export type SelectShape = "control" | "pill";

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  selectSize?: SelectSize;
  tone?: SelectTone;
  shape?: SelectShape;
  invalid?: boolean;
  fullWidth?: boolean;
  /** Classes for the positioning wrapper (e.g. fixed widths like `w-20` in dense grids). */
  wrapperClassName?: string;
}

const BASE =
  "block w-full appearance-none " +
  "text-[var(--color-text-primary)] border " +
  "transition-[border-color,box-shadow] duration-[var(--motion-fast)] ease-[var(--motion-ease)] " +
  "focus-visible:outline-none focus-visible:border-[var(--color-accent)] " +
  "focus-visible:ring-2 focus-visible:ring-[var(--color-accent-dim)] " +
  "disabled:opacity-50 disabled:pointer-events-none";

const TONES: Record<SelectTone, string> = {
  elevated: "bg-[var(--surface-elevated)] border-[var(--surface-border-strong)]",
  subtle: "bg-black/[0.04] border-[var(--surface-border)]",
  surface: "bg-[var(--color-bg-surface)] border-[var(--surface-border)]",
};

const SHAPES: Record<SelectShape, string> = {
  control: "rounded-[var(--radius-control)]",
  pill: "rounded-full",
};

const SIZES: Record<SelectSize, string> = {
  xs: "py-1 pl-2.5 pr-8 text-xs",
  sm: "h-8 pl-2.5 pr-8 text-[13px]",
  md: "h-10 pl-3 pr-9 text-sm",
};

const INVALID =
  "border-[var(--signal-red)] focus-visible:border-[var(--signal-red)] " +
  "focus-visible:ring-[color-mix(in_srgb,var(--signal-red)_25%,transparent)]";

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { selectSize = "md", tone = "elevated", shape = "control", invalid, fullWidth, wrapperClassName, className, children, ...rest },
  ref,
) {
  return (
    <div className={cn("relative inline-flex", fullWidth && "w-full", wrapperClassName)}>
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(BASE, TONES[tone], SHAPES[shape], SIZES[selectSize], invalid && INVALID, className)}
        {...rest}
      >
        {children}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-[var(--color-text-muted)]"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
});
