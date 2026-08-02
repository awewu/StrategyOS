"use client";

/**
 * Textarea — StratOS primitive (Track B · B1.1).
 *
 * Multiline sibling of Input: same token-bound border/focus/invalid treatment,
 * vertical resize by default. `fullWidth` matches the Input/Select/Button
 * convention. All colors resolve from app/globals.css L0 tokens.
 */
import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/ui/cn";

export type TextareaSize = "xs" | "sm" | "md";
export type TextareaTone = "elevated" | "subtle";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  textareaSize?: TextareaSize;
  tone?: TextareaTone;
  invalid?: boolean;
  fullWidth?: boolean;
}

const BASE =
  "rounded-[var(--radius-control)] " +
  "text-[var(--color-text-primary)] border resize-y " +
  "placeholder:text-[var(--color-text-muted)] " +
  "transition-[border-color,box-shadow] duration-[var(--motion-fast)] ease-[var(--motion-ease)] " +
  "focus-visible:outline-none focus-visible:border-[var(--color-accent)] " +
  "focus-visible:ring-2 focus-visible:ring-[var(--color-accent-dim)] " +
  "disabled:opacity-50 disabled:pointer-events-none";

const TONES: Record<TextareaTone, string> = {
  elevated: "bg-[var(--surface-elevated)] border-[var(--surface-border-strong)]",
  subtle: "bg-black/[0.04] border-[var(--surface-border)]",
};

const SIZES: Record<TextareaSize, string> = {
  xs: "px-2 py-1 text-xs",
  sm: "px-2.5 py-1.5 text-[13px]",
  md: "px-3 py-2 text-sm",
};

const INVALID =
  "border-[var(--signal-red)] focus-visible:border-[var(--signal-red)] " +
  "focus-visible:ring-[color-mix(in_srgb,var(--signal-red)_25%,transparent)]";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { textareaSize = "md", tone = "elevated", invalid, fullWidth, className, ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(BASE, TONES[tone], SIZES[textareaSize], fullWidth && "block w-full", invalid && INVALID, className)}
      {...rest}
    />
  );
});
