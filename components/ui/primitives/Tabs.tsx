"use client";

/**
 * Tabs — StratOS primitive (Track B · B1).
 *
 * Controlled, token-bound in-page tabs (button/tablist semantics). Two visual
 * variants: `underline` (default, for content sections) and `segment` (pill
 * group, for compact filters). For route-based tabs use StratosTabNav instead.
 */
import { type ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

export type TabsVariant = "underline" | "segment";
export type TabsSize = "sm" | "md";

export interface TabItem {
  value: string;
  label: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onValueChange: (value: string) => void;
  variant?: TabsVariant;
  size?: TabsSize;
  className?: string;
  "aria-label"?: string;
}

const SIZES: Record<TabsSize, string> = {
  sm: "h-8 px-3 text-[var(--type-body-sm)] [&_svg]:size-4",
  md: "h-10 px-4 text-sm [&_svg]:size-[18px]",
};

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-elevated)]";

function itemClass(variant: TabsVariant, active: boolean, size: TabsSize): string {
  const base = cn(
    "inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap select-none",
    "transition-[color,background-color,border-color] duration-[var(--motion-fast)] ease-[var(--motion-ease)]",
    "disabled:opacity-50 disabled:pointer-events-none",
    SIZES[size],
    FOCUS,
  );
  if (variant === "segment") {
    return cn(
      base,
      "rounded-[var(--radius-control)]",
      active
        ? "bg-[var(--surface-elevated)] text-[var(--color-accent)] shadow-sm"
        : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]",
    );
  }
  return cn(
    base,
    "-mb-px border-b-2",
    active
      ? "border-[var(--color-accent)] text-[var(--color-accent)]"
      : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]",
  );
}

export function Tabs({
  items,
  value,
  onValueChange,
  variant = "underline",
  size = "md",
  className,
  "aria-label": ariaLabel,
}: TabsProps) {
  const listClass =
    variant === "segment"
      ? "inline-flex items-center gap-1 rounded-[var(--radius-control)] bg-[var(--surface-raised)] p-1"
      : "flex items-center gap-1 border-b border-[var(--surface-border)]";

  return (
    <div role="tablist" aria-label={ariaLabel} className={cn(listClass, "flex-wrap", className)}>
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={item.disabled}
            onClick={() => onValueChange(item.value)}
            className={itemClass(variant, active, size)}
          >
            {item.icon}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
