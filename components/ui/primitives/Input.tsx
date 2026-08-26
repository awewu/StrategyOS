"use client";

/**
 * Input — StratOS primitive (Track B · B1).
 *
 * Token-bound text field matching Button's control metrics (height, radius,
 * focus ring). `invalid` flips border/ring to the risk signal and sets
 * aria-invalid. All colors resolve from app/globals.css L0 tokens.
 */
import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/ui/cn";

export type InputSize = "xs" | "sm" | "md";
export type InputTone = "elevated" | "subtle";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  inputSize?: InputSize;
  tone?: InputTone;
  invalid?: boolean;
  fullWidth?: boolean;
}

const BASE =
  "rounded-[var(--radius-control)] " +
  "text-[var(--color-text-primary)] border " +
  "placeholder:text-[var(--color-text-muted)] " +
  "transition-[border-color,box-shadow] duration-[var(--motion-fast)] ease-[var(--motion-ease)] " +
  "focus-visible:outline-none focus-visible:border-[var(--color-accent)] " +
  "focus-visible:ring-2 focus-visible:ring-[var(--color-accent-dim)] " +
  "disabled:opacity-50 disabled:pointer-events-none";

const TONES: Record<InputTone, string> = {
  elevated: "bg-[var(--surface-elevated)] border-[var(--surface-border-strong)]",
  subtle: "bg-black/[0.04] border-[var(--surface-border)]",
};

const SIZES: Record<InputSize, string> = {
  xs: "px-2 py-1 text-xs",
  sm: "h-8 px-2.5 text-[var(--type-body-sm)]",
  md: "h-10 px-3 text-sm",
};

const INVALID =
  "border-[var(--signal-red)] focus-visible:border-[var(--signal-red)] " +
  "focus-visible:ring-[color-mix(in_srgb,var(--signal-red)_25%,transparent)]";

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { inputSize = "md", tone = "elevated", invalid, fullWidth, className, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(BASE, TONES[tone], SIZES[inputSize], fullWidth && "block w-full", invalid && INVALID, className)}
      {...rest}
    />
  );
});
