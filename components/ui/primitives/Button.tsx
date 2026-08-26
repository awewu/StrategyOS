"use client";

/**
 * Button — StratOS primitive (Track B · B0).
 *
 * Design language: Claude/MD3 — restrained accent (teal interactive, red = risk
 * only), MD3 state layer via hover, visible focus ring, token-bound motion.
 * All colors/radius/motion resolve from `app/globals.css` L0 tokens; no palette
 * is hard-coded here beyond token references.
 */
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const BASE =
  "inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap select-none " +
  "rounded-[var(--radius-control)] transition-[background-color,color,box-shadow,filter] " +
  "duration-[var(--motion-fast)] ease-[var(--motion-ease)] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-elevated)] " +
  "disabled:opacity-50 disabled:pointer-events-none";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-accent)] text-white shadow-sm hover:bg-[var(--color-accent-bright)] active:brightness-95",
  secondary:
    "bg-[var(--surface-elevated)] text-[var(--color-text-primary)] border border-[var(--surface-border-strong)] " +
    "shadow-sm hover:bg-[var(--surface-raised)] active:bg-[var(--surface-raised)]",
  ghost:
    "bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-accent-dim)] " +
    "hover:text-[var(--color-accent)] active:bg-[var(--color-accent-dim)]",
  danger:
    "bg-[var(--signal-red)] text-white shadow-sm hover:brightness-110 active:brightness-95",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[var(--type-body-sm)] [&_svg]:size-4",
  md: "h-10 px-4 text-sm [&_svg]:size-[18px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", fullWidth, leftIcon, rightIcon, className, children, type, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type ?? "button"}
      className={cn(BASE, VARIANTS[variant], SIZES[size], fullWidth && "w-full", className)}
      {...rest}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  );
});
