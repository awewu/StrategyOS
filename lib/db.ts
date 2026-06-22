/**
 * Prisma client singleton — falls back gracefully when DATABASE_URL unset.
 * Recreates the client when HMR leaves a stale instance missing new models.
 */
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

/** Prisma delegates that must exist after `prisma generate` — used to bust HMR-stale clients. */
const REQUIRED_PRISMA_DELEGATES = [
  "strategyOnePager",
  "decodeBscRow",
  "feedbackLoopRecord",
  "gateChecklistItem",
  "cultureAwardWinner",
  "twelveDimScore",
  "planMilestone",
  "planPremise",
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

function isStalePrismaClient(client: PrismaClient): boolean {
  return REQUIRED_PRISMA_DELEGATES.some((key) => {
    const delegate = (client as unknown as Record<string, unknown>)[key];
    return delegate == null || typeof (delegate as { findUnique?: unknown }).findUnique !== "function";
  });
}

function invalidatePrismaClient(): void {
  const cached = globalForPrisma.prisma;
  if (cached) {
    void cached.$disconnect().catch(() => {});
  }
  globalForPrisma.prisma = undefined;
  dbReady = null;
}

function getPrismaClient(): PrismaClient {
  const cached = globalForPrisma.prisma;
  if (cached && !isStalePrismaClient(cached)) return cached;

  if (cached) {
    void cached.$disconnect().catch(() => {});
  }

  const client = createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }
  return client;
}

/** Always routes through getPrismaClient() — avoids HMR holding a stale `const prisma`. */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = Reflect.get(client, prop, client) as unknown;
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(client);
    }
    return value;
  },
});

let dbReady: boolean | null = null;

function isPrismaDelegateError(err: unknown): boolean {
  return (
    err instanceof TypeError &&
    /findUnique|findMany|create|update|upsert|deleteMany/.test(String(err.message))
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
  invalidatePrismaClient();
}

export async function dbAvailable(): Promise<boolean> {
  if (dbReady === false) return false;
  if (dbReady === true) return true;
  dbReady = await probeDb();
  return dbReady;
}

/** Run a DB query; on failure fall back to demo data and mark DB unavailable for this process. */
export async function safeDbQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  if (!(await dbAvailable())) return fallback;
  try {
    return await fn();
  } catch (err) {
    if (isPrismaDelegateError(err)) {
      invalidatePrismaClient();
    }
    dbReady = false;
    if (process.env.NODE_ENV === "development") {
      console.warn("[StratOS] DB query failed — using demo fallback:", err);
    }
    return fallback;
  }
}
