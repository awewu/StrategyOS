/**
 * Prisma client singleton — falls back gracefully when DATABASE_URL unset.
 * Uses globalThis in all environments so dev HMR and prod workers share one pool.
 */
import { PrismaClient } from "@prisma/client";

type PrismaGlobal = {
  prisma: PrismaClient | undefined;
  /** Prevents stale-check recreation loops when `prisma generate` is out of date. */
  prismaStaleRecreateDone: boolean | undefined;
};

const globalForPrisma = globalThis as unknown as PrismaGlobal;

/** Prisma delegates that must exist after `prisma generate` — checked once per process/HMR cycle. */
const REQUIRED_PRISMA_DELEGATES = [
  "strategyOnePager",
  "decodeBscRow",
  "feedbackLoopRecord",
  "gateChecklistItem",
  "cultureAwardWinner",
  "twelveDimScore",
  "planMilestone",
  "planPremise",
  "planSwotItem",
  "planOrgChartNode",
  "planChannelPlan",
  "planCustomerPlan",
  "planProductQuarterly",
  "planMarketInsight",
  "planActionItem",
  "planBudgetItem",
  "planRoadmapItem",
  "strategicOutlook",
  "strategicCapitalConfig",
  "cultureHandbook",
  "strategicExecutionAnalytics",
  "strategicBscConfig",
  "strategicManagementAdjustments",
  "strategicGrowthAnalytics",
  "strategicCommandConfig",
  "executionScoreboardConfig",
] as const;

function resolveDatabaseUrl(): string | undefined {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) return undefined;

  let url = raw;
  if (!/[?&]connection_limit=/i.test(url)) {
    const limit = process.env.NODE_ENV === "production" ? "10" : "3";
    url += `${url.includes("?") ? "&" : "?"}connection_limit=${limit}`;
  }
  if (!/[?&]pool_timeout=/i.test(url)) {
    url += `${url.includes("?") ? "&" : "?"}pool_timeout=10`;
  }
  return url;
}

function createPrismaClient(): PrismaClient {
  const url = resolveDatabaseUrl();
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    ...(url ? { datasources: { db: { url } } } : {}),
  });
}

function isStalePrismaClient(client: PrismaClient): boolean {
  return REQUIRED_PRISMA_DELEGATES.some((key) => {
    const delegate = (client as unknown as Record<string, unknown>)[key];
    return delegate == null || typeof (delegate as { findUnique?: unknown }).findUnique !== "function";
  });
}

function disconnectQuietly(client: PrismaClient): void {
  void client.$disconnect().catch(() => {});
}

function setPrismaClient(client: PrismaClient): PrismaClient {
  globalForPrisma.prisma = client;
  return client;
}

function getOrCreatePrismaClient(): PrismaClient {
  const cached = globalForPrisma.prisma;
  if (cached && !isStalePrismaClient(cached)) return cached;

  if (cached && !globalForPrisma.prismaStaleRecreateDone) {
    globalForPrisma.prismaStaleRecreateDone = true;
    disconnectQuietly(cached);
    dbReady = null;
    return setPrismaClient(createPrismaClient());
  }

  if (cached) return cached;

  return setPrismaClient(createPrismaClient());
}

/** Always routes through getOrCreatePrismaClient() — avoids HMR holding a stale `const prisma`. */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getOrCreatePrismaClient();
    const value = Reflect.get(client, prop, client) as unknown;
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(client);
    }
    return value;
  },
});

let dbReady: boolean | null = null;

/** Whether demo fallback is allowed in the current runtime. */
export function demoFallbackAllowed(): boolean {
  // In production, demo fallback is opt-in via explicit emergency flag.
  if (process.env.NODE_ENV === "production") {
    return process.env.STRATOS_ALLOW_DEMO_FALLBACK === "1";
  }
  // Dev/test allow demo fallback by default to ease local setup.
  return true;
}

/** Throws a clear error when the database is required but unavailable in production. */
export function assertDbAvailable(): void {
  if (dbReady === false) {
    if (!demoFallbackAllowed()) {
      throw new Error(
        "StratOS production: database unavailable and demo fallback is disabled. " +
          "Set STRATOS_ALLOW_DEMO_FALLBACK=1 only as an emergency bypass, or restore the database connection.",
      );
    }
  }
}

/** Probes DB and throws in production if it is unavailable and demo fallback is disabled. */
export async function requireDbAvailable(): Promise<void> {
  await dbAvailable();
  assertDbAvailable();
}

function isPrismaDelegateError(err: unknown): boolean {
  return (
    err instanceof TypeError &&
    /findUnique|findMany|create|update|upsert|deleteMany/.test(String(err.message))
  );
}

function isDbConnectionError(err: unknown): boolean {
  const msg = String(err instanceof Error ? err.message : err);
  return /too many clients|connection pool|ECONNREFUSED|ECONNRESET|P1001|P1017|P2024|Timed out fetching/i.test(
    msg,
  );
}

async function probeDb(): Promise<boolean> {
  if (!process.env.DATABASE_URL) return false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    const cols = await prisma.$queryRaw<{ column_name: string }[]>`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'users'
        AND column_name IN ('org_unit_id', 'project_code')
    `;
    const found = new Set(cols.map((c) => c.column_name));
    return found.has("org_unit_id") && found.has("project_code");
  } catch {
    return false;
  }
}

/** Cast to Prisma InputJsonValue-compatible payload */
export function asDbJson<T>(value: T): object {
  return value as object;
}

/** Reset after schema sync (e.g. prisma db push) without restarting dev server. */
export function invalidateDbCache(): void {
  const cached = globalForPrisma.prisma;
  if (cached) disconnectQuietly(cached);
  globalForPrisma.prisma = undefined;
  globalForPrisma.prismaStaleRecreateDone = undefined;
  dbReady = null;
}

export async function dbAvailable(): Promise<boolean> {
  if (dbReady === false) return false;
  if (dbReady === true) return true;
  dbReady = await probeDb();
  return dbReady;
}

/** Run a DB query; on failure fall back to demo data only when allowed. */
export async function safeDbQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  if (!(await dbAvailable())) {
    if (!demoFallbackAllowed()) {
      throw new Error(
        "StratOS production: database is unavailable and demo fallback is disabled. " +
          "Restore the database connection or set STRATOS_ALLOW_DEMO_FALLBACK=1 as an emergency bypass.",
      );
    }
    return fallback;
  }
  try {
    return await fn();
  } catch (err) {
    if (isPrismaDelegateError(err) || isDbConnectionError(err)) {
      invalidateDbCache();
    }
    dbReady = false;
    if (!demoFallbackAllowed()) {
      throw new Error(
        `StratOS production: database query failed and demo fallback is disabled. ` +
          `Restore the database connection or set STRATOS_ALLOW_DEMO_FALLBACK=1 as an emergency bypass. ` +
          `Original error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
    console.warn("[StratOS] DB query failed — using demo fallback:", err);
    return fallback;
  }
}
