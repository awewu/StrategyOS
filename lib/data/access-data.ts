import { DEMO_USERS } from "@/lib/auth/config";
import { getMemoryLogs } from "@/lib/audit/log-event";
import type { UsageLogRecord } from "@/lib/audit/types";
import { dbAvailable, prisma } from "@/lib/db";
import type { RoleKey } from "@/lib/constants";

export interface AccessUser {
  id: string;
  name: string;
  email: string;
  role: RoleKey;
  createdAt?: Date;
}

export async function getUsers(): Promise<AccessUser[]> {
  if (!(await dbAvailable())) {
    return DEMO_USERS.map((u) => ({
      id: u.userId,
      name: u.name,
      email: u.email,
      role: u.role,
    }));
  }

  const rows = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  if (rows.length === 0) {
    return DEMO_USERS.map((u) => ({
      id: u.userId,
      name: u.name,
      email: u.email,
      role: u.role,
    }));
  }

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    role: r.role as RoleKey,
    createdAt: r.createdAt,
  }));
}

export async function getRecentLogs(limit = 50): Promise<UsageLogRecord[]> {
  if (!(await dbAvailable())) {
    return getMemoryLogs(limit);
  }

  try {
    const rows = await prisma.usageLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    if (rows.length === 0) return getMemoryLogs(limit);
    return rows.map((r) => ({
      id: r.id,
      userId: r.userId ?? undefined,
      userEmail: r.userEmail,
      action: r.action,
      resource: r.resource,
      metadata: (r.metadata as Record<string, unknown> | null) ?? undefined,
      ip: r.ip ?? undefined,
      userAgent: r.userAgent ?? undefined,
      createdAt: r.createdAt,
    }));
  } catch {
    return getMemoryLogs(limit);
  }
}
