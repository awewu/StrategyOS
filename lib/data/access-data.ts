import { DEMO_USERS } from "@/lib/auth/config";
import { getMemoryLogs } from "@/lib/audit/log-event";
import { verifyAuditChain, type ChainVerification } from "@/lib/audit/verify-chain";
import type { UsageLogRecord } from "@/lib/audit/types";
import { dbAvailable, prisma } from "@/lib/db";
import type { RoleKey } from "@/lib/constants";

export interface AccessUser {
  id: string;
  name: string;
  email: string;
  role: RoleKey;
  orgUnitId?: string | null;
  orgUnitName?: string | null;
  orgScopeIds?: string[];
  orgScopeNames?: string[];
  projectCode?: string | null;
  createdAt?: Date;
}

export async function getUsers(): Promise<AccessUser[]> {
  if (!(await dbAvailable())) {
    return DEMO_USERS.map((u) => ({
      id: u.userId,
      name: u.name,
      email: u.email,
      role: u.role,
      orgUnitId: u.orgUnitId,
      orgScopeIds: u.orgScopeIds ?? (u.orgUnitId ? [u.orgUnitId] : []),
      projectCode: u.projectCode,
    }));
  }

  const rows = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      orgUnit: { select: { name: true } },
      orgScopes: { include: { orgUnit: { select: { name: true } } }, orderBy: { createdAt: "asc" } },
    },
  });
  if (rows.length === 0) {
    return DEMO_USERS.map((u) => ({
      id: u.userId,
      name: u.name,
      email: u.email,
      role: u.role,
      orgUnitId: u.orgUnitId,
      orgScopeIds: u.orgScopeIds ?? (u.orgUnitId ? [u.orgUnitId] : []),
      projectCode: u.projectCode,
    }));
  }

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    role: r.role as RoleKey,
    orgUnitId: r.orgUnitId,
    orgUnitName: r.orgUnit?.name ?? null,
    orgScopeIds: r.orgScopes.map((scope) => scope.orgUnitId),
    orgScopeNames: r.orgScopes.map((scope) => scope.orgUnit.name),
    projectCode: r.projectCode,
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
      prevHash: r.prevHash ?? undefined,
      hash: r.hash ?? undefined,
      createdAt: r.createdAt,
    }));
  } catch {
    return getMemoryLogs(limit);
  }
}

/** Tamper-evidence status for the audit log, surfaced in the access panel. */
export async function getAuditIntegrity(): Promise<ChainVerification> {
  return verifyAuditChain();
}
