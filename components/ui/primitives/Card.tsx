/**
 * Card — StratOS primitive (Track B · B0).
 *
 * Elevation via token surface + hairline border + soft shadow (Claude calm
 * surfaces). Composable: Card / CardHeader / CardTitle / CardDescription /
 * CardBody / CardFooter. Radius + surfaces resolve from L0 tokens.
 */
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

export type CardTone = "default" | "raised" | "flush";

const TONES: Record<CardTone, string> = {
  default: "bg-[var(--surface-elevated)] border border-[var(--surface-border)] shadow-sm",
  raised: "bg-[var(--surface-elevated)] border border-[var(--surface-border-strong)] shadow-md",
  flush: "bg-transparent border border-[var(--surface-border)]",
};

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: CardTone;
  interactive?: boolean;
}

export function Card({ tone = "default", interactive, className, children, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] overflow-hidden",
        TONES[tone],
        interactive &&
          "transition-shadow duration-[var(--motion-base)] ease-[var(--motion-ease)] hover:shadow-md cursor-pointer",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 px-[var(--space-card)] pt-[var(--space-card)] pb-3",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  action,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { action?: ReactNode }) {
  return (
    <div className="flex w-full items-center justify-between gap-3">
      <h3
        className={cn(
          "text-[var(--type-section)] font-semibold leading-tight text-[var(--color-text-primary)]",
          className,
        )}
        {...rest}
      >
        {children}
      </h3>
      {action}
    </div>
  );
}

export function CardDescription({ className, children, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("mt-1 text-sm text-[var(--color-text-muted)]", className)} {...rest}>
      {children}
    </p>
  );
}

export function CardBody({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("px-[var(--space-card)] pb-[var(--space-card)]", className)} {...rest}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-2 border-t border-[var(--surface-border)] " +
          "px-[var(--space-card)] py-3 bg-[var(--surface-raised)]",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
