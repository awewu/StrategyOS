export const DEFAULT_PRODUCT_QUARTERLY_YEARS = [2026, 2027, 2028] as const;
export const LEGACY_PRODUCT_QUARTERLY_YEAR = 2027;

const MIN_PRODUCT_YEAR = 2000;
const MAX_PRODUCT_YEAR = 2100;

export function parseProductQuarterlyYear(value: unknown): number | null {
  const year = typeof value === "number"
    ? value
    : typeof value === "string" && value.trim()
      ? Number(value)
      : Number.NaN;
  if (!Number.isInteger(year) || year < MIN_PRODUCT_YEAR || year > MAX_PRODUCT_YEAR) return null;
  return year;
}

export function productQuarterlyYearOrLegacy(value: unknown): number {
  return parseProductQuarterlyYear(value) ?? LEGACY_PRODUCT_QUARTERLY_YEAR;
}

export function normalizeProductQuarterlyYears(rawYears: unknown, rows: unknown = []): number[] {
  const years: number[] = [...DEFAULT_PRODUCT_QUARTERLY_YEARS];
  const append = (value: unknown) => {
    const year = parseProductQuarterlyYear(value);
    if (year !== null && !years.includes(year)) years.push(year);
  };

  if (Array.isArray(rawYears)) rawYears.forEach(append);
  if (Array.isArray(rows)) {
    rows.forEach((row) => {
      if (row && typeof row === "object" && "year" in row) {
        append((row as { year?: unknown }).year);
      }
    });
  }
  return years;
}

export function isDefaultProductQuarterlyYear(year: number): boolean {
  return DEFAULT_PRODUCT_QUARTERLY_YEARS.includes(year as (typeof DEFAULT_PRODUCT_QUARTERLY_YEARS)[number]);
}
