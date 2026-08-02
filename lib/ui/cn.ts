/**
 * cn — dependency-free className joiner for StratOS primitives.
 *
 * Deliberately tiny: no clsx / tailwind-merge dependency. Primitives own their
 * variant class strings and keep them non-conflicting, so a filter-join is
 * sufficient. Consumer-supplied `className` is always appended last so callers
 * can override.
 */
export type ClassValue = string | number | false | null | undefined;

export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}
