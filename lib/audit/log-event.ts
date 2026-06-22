import { getSession } from "@/lib/auth/session";
import { dbAvailable, prisma } from "@/lib/db";
import { GENESIS_HASH, computeLogHash } from "@/lib/audit/hash";
import type { UsageAction, UsageLogRecord } from "@/lib/audit/types";

const memoryLogs: UsageLogRecord[] = [];
const MAX_MEMORY_LOGS = 500;
/** Tail hash of the in-memory chain — preserved even when the window is trimmed. */
let memoryChainTip = GENESIS_HASH;

export interface LogUsageEventInput {
  action: UsageAction;
  resource: string;
  metadata?: Record<string, unknown>;
  request?: Request;
  userEmail?: string;
  userId?: string;
}

function extractRequestMeta(request?: Request): { ip?: string; userAgent?: string } {
  if (!request) return {};
  const forwarded = request.headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    undefined;
  const userAgent = request.headers.get("user-agent") ?? undefined;
  return { ip, userAgent };
}

export async function logUsageEvent(input: LogUsageEventInput): Promise<UsageLogRecord> {
  let sessionEmail: string | undefined;
  let sessionUserId: string | undefined;
  if (!input.userEmail || !input.userId) {
    try {
      const session = await getSession();
      sessionEmail = session?.email;
      sessionUserId = session?.userId;
    } catch {
      /* outside Next.js request scope (tests, scripts) */
    }
  }

  const userEmail = input.userEmail ?? sessionEmail ?? "anonymous";
  const userId = input.userId ?? sessionUserId;
  const { ip, userAgent } = extractRequestMeta(input.request);
  const metadata = input.metadata;

  if (await dbAvailable()) {
    try {
      const row = await prisma.$transaction(async (tx) => {
        const last = await tx.usageLog.findFirst({
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          select: { hash: true },
        });
        const prevHash = last?.hash ?? GENESIS_HASH;
        const createdAt = new Date();
        const hash = computeLogHash({
          prevHash,
          createdAt,
          userEmail,
          action: input.action,
          resource: input.resource,
          metadata,
          ip,
        });
        return tx.usageLog.create({
          data: {
            userId: userId ?? null,
            userEmail,
            action: input.action,
            resource: input.resource,
            metadata: (metadata ?? undefined) as object | undefined,
            ip,
            userAgent,
            prevHash,
            hash,
            createdAt,
          },
        });
      });
      return {
        id: row.id,
        userId: row.userId ?? undefined,
        userEmail: row.userEmail,
        action: row.action as UsageAction,
        resource: row.resource,
        metadata: (row.metadata as Record<string, unknown> | null) ?? undefined,
        ip: row.ip ?? undefined,
        userAgent: row.userAgent ?? undefined,
        prevHash: row.prevHash ?? undefined,
        hash: row.hash ?? undefined,
        createdAt: row.createdAt,
      };
    } catch (err) {
      // Never silently drop an audit event: surface the failure, then chain
      // it into the in-memory fallback so nothing is lost mid-request.
      console.error("[StratOS] audit DB write failed — falling back to memory chain:", err);
    }
  }

  return appendMemoryLog({ userId, userEmail, action: input.action, resource: input.resource, metadata, ip, userAgent });
}

function appendMemoryLog(input: {
  userId?: string;
  userEmail: string;
  action: UsageAction;
  resource: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}): UsageLogRecord {
  const createdAt = new Date();
  const prevHash = memoryChainTip;
  const hash = computeLogHash({
    prevHash,
    createdAt,
    userEmail: input.userEmail,
    action: input.action,
    resource: input.resource,
    metadata: input.metadata,
    ip: input.ip,
  });
  memoryChainTip = hash;

  const record: UsageLogRecord = {
    id: crypto.randomUUID(),
    userId: input.userId,
    userEmail: input.userEmail,
    action: input.action,
    resource: input.resource,
    metadata: input.metadata,
    ip: input.ip,
    userAgent: input.userAgent,
    prevHash,
    hash,
    createdAt,
  };

  memoryLogs.unshift(record);
  if (memoryLogs.length > MAX_MEMORY_LOGS) memoryLogs.pop();
  return record;
}

/** Returns the most recent logs, newest first. */
export function getMemoryLogs(limit = 50): UsageLogRecord[] {
  return memoryLogs.slice(0, limit);
}

/** Oldest-first copy of the in-memory chain, for verification. */
export function getMemoryChain(): UsageLogRecord[] {
  return [...memoryLogs].reverse();
}
