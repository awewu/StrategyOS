/**
 * DB-driven active strategic period.
 *
 * The "current period" is no longer a hardcoded literal — it is derived from the
 * company-scope FpaPeriod rows present in the database. `CURRENT_PERIOD` from
 * `@/lib/constants` remains the deterministic fallback for demo mode / empty DB
 * and for synchronous defaults.
 */
import { dbAvailable, prisma } from "@/lib/db";
import { CURRENT_PERIOD } from "@/lib/constants";

/** Rank of a period label within a year — FY (full year) outranks halves/quarters. */
function periodRank(label: string): { year: number; phase: number } | null {
  const m = /^(\d{4})-(FY|H1|H2|Q1|Q2|Q3|Q4)$/.exec(label.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const phaseOrder: Record<string, number> = {
    Q1: 1, H1: 2, Q2: 3, Q3: 4, H2: 5, Q4: 6, FY: 7,
  };
  return { year, phase: phaseOrder[m[2]] ?? 0 };
}

/**
 * Pick the most-current period from a set of labels.
 * Highest year wins; within a year, the broadest/latest phase (FY) wins.
 * Returns the fallback when no label is parseable.
 */
export function pickActivePeriod(periods: string[], fallback = CURRENT_PERIOD): string {
  let best: { label: string; year: number; phase: number } | null = null;
  for (const p of periods) {
    const r = periodRank(p);
    if (!r) continue;
    if (!best || r.year > best.year || (r.year === best.year && r.phase > best.phase)) {
      best = { label: p, ...r };
    }
  }
  return best?.label ?? fallback;
}

/** SystemSetting key holding the authoritative active period. */
export const ACTIVE_PERIOD_SETTING_KEY = "active_period";

const TTL_MS = 30_000;

/**
 * Pluggable data source for active-period resolution. Injected in tests so the
 * cache / TTL / fallback / priority logic can be exercised without a database.
 */
export interface ActivePeriodSource {
  dbAvailable: () => Promise<boolean>;
  /** Authoritative explicit setting, or null when unset. */
  loadSetting: () => Promise<string | null>;
  /** Company-scope period labels, used as a heuristic fallback. */
  loadCompanyPeriods: () => Promise<string[]>;
  now: () => number;
}

const defaultSource: ActivePeriodSource = {
  dbAvailable,
  loadSetting: async () => {
    const row = await prisma.systemSetting.findUnique({
      where: { key: ACTIVE_PERIOD_SETTING_KEY },
    });
    return row?.value ?? null;
  },
  loadCompanyPeriods: async () => {
    const rows = await prisma.fpaPeriod.findMany({
      where: { scope: "company" },
      select: { period: true },
    });
    return rows.map((r) => r.period);
  },
  now: () => Date.now(),
};

/**
 * Build an active-period resolver over a data source.
 * Resolution order: explicit SystemSetting → company FpaPeriod heuristic →
 * CURRENT_PERIOD constant. Results are cached for `ttlMs` and any error falls
 * back to the constant.
 */
export function createActivePeriodResolver(
  source: ActivePeriodSource = defaultSource,
  ttlMs = TTL_MS,
) {
  let cache: { value: string; at: number } | null = null;

  async function get(): Promise<string> {
    if (cache && source.now() - cache.at < ttlMs) return cache.value;
    try {
      if (await source.dbAvailable()) {
        const setting = (await source.loadSetting())?.trim();
        if (setting) {
          cache = { value: setting, at: source.now() };
          return setting;
        }
        const periods = await source.loadCompanyPeriods();
        const value = pickActivePeriod(periods);
        cache = { value, at: source.now() };
        return value;
      }
    } catch {
      // fall through to constant fallback
    }
    return CURRENT_PERIOD;
  }

  return {
    get,
    reset: () => {
      cache = null;
    },
  };
}

const defaultResolver = createActivePeriodResolver();

/** Resolve the active period (SystemSetting → FpaPeriod heuristic → constant), cached. */
export function getActivePeriod(): Promise<string> {
  return defaultResolver.get();
}

/** Clear the in-process cache (used after a freeze / period roll-forward, and in tests). */
export function resetActivePeriodCache(): void {
  defaultResolver.reset();
}

/** Persist the authoritative active period to SystemSetting and invalidate the cache. */
export async function setActivePeriod(period: string): Promise<void> {
  const value = period.trim();
  if (!value) throw new Error("active period cannot be empty");
  await prisma.systemSetting.upsert({
    where: { key: ACTIVE_PERIOD_SETTING_KEY },
    update: { value },
    create: { key: ACTIVE_PERIOD_SETTING_KEY, value },
  });
  resetActivePeriodCache();
}
