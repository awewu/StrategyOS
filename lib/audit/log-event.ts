import { getSession } from "@/lib/auth/session";
import { dbAvailable, prisma } from "@/lib/db";
import type { UsageAction, UsageLogRecord } from "@/lib/audit/types";

const memoryLogs: UsageLogRecord[] = [];
const MAX_MEMORY_LOGS = 500;

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

  const record: UsageLogRecord = {
    id: crypto.randomUUID(),
    userId,
    userEmail,
    action: input.action,
    resource: input.resource,
    metadata: input.metadata,
    ip,
    userAgent,
    createdAt: new Date(),
  };

  if (await dbAvailable()) {
    try {
      const row = await prisma.usageLog.create({
        data: {
          userId: userId ?? null,
          userEmail,
          action: input.action,
          resource: input.resource,
          metadata: (input.metadata ?? undefined) as object | undefined,
          ip,
          userAgent,
        },
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
        createdAt: row.createdAt,
      };
    } catch {
      /* fall through to memory */
    }
  }

  memoryLogs.unshift(record);
  if (memoryLogs.length > MAX_MEMORY_LOGS) memoryLogs.pop();
  return record;
}

export function getMemoryLogs(limit = 50): UsageLogRecord[] {
  return memoryLogs.slice(0, limit);
}
