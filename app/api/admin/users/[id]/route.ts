import { NextResponse } from "next/server";
import { logUsageEvent } from "@/lib/audit/log-event";
import { requireApiAdmin } from "@/lib/auth/api-guard";
import { getSession } from "@/lib/auth/session";
import { PROJECT_CODES, ROLES, type RoleKey } from "@/lib/constants";
import { dbAvailable, prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseNullableString(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function parseStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const ids = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
  return [...new Set(ids)];
}

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const denied = await requireApiAdmin();
  if (denied) return denied;

  if (!(await dbAvailable())) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const session = await getSession();
  const { id } = await ctx.params;
  if (session?.userId === id) {
    return NextResponse.json({ error: "Cannot edit your own permissions" }, { status: 400 });
  }

  const body = (await request.json()) as {
    role?: unknown;
    orgScopeIds?: unknown;
    projectCode?: unknown;
  };

  if (typeof body.role !== "string" || !(body.role in ROLES)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const orgScopeIds = parseStringArray(body.orgScopeIds);
  const projectCode = parseNullableString(body.projectCode);
  if (orgScopeIds === undefined || projectCode === undefined) {
    return NextResponse.json({ error: "Invalid scope payload" }, { status: 400 });
  }

  if (projectCode && !PROJECT_CODES.includes(projectCode as (typeof PROJECT_CODES)[number])) {
    return NextResponse.json({ error: "Invalid projectCode" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({
    where: { id },
    include: { orgScopes: { select: { orgUnitId: true } } },
  });
  if (!existing) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (orgScopeIds.length > 0) {
    const orgCount = await prisma.orgUnit.count({ where: { id: { in: orgScopeIds } } });
    if (orgCount !== orgScopeIds.length) {
      return NextResponse.json({ error: "Org scope contains missing org unit" }, { status: 400 });
    }
  }

  const primaryOrgUnitId = orgScopeIds[0] ?? null;
  const updated = await prisma.$transaction(async (tx) => {
    await tx.userOrgScope.deleteMany({ where: { userId: id } });
    if (orgScopeIds.length > 0) {
      await tx.userOrgScope.createMany({
        data: orgScopeIds.map((scopeId) => ({ userId: id, orgUnitId: scopeId })),
        skipDuplicates: true,
      });
    }
    return tx.user.update({
      where: { id },
      data: {
        role: body.role as RoleKey,
        orgUnitId: primaryOrgUnitId,
        projectCode,
      },
      include: {
        orgUnit: { select: { name: true } },
        orgScopes: { include: { orgUnit: { select: { name: true } } }, orderBy: { createdAt: "asc" } },
      },
    });
  });

  await logUsageEvent({
    action: "permission_update",
    resource: updated.email,
    request,
    metadata: {
      before: {
        role: existing.role,
        orgUnitId: existing.orgUnitId,
        orgScopeIds: existing.orgScopes.map((scope) => scope.orgUnitId),
        projectCode: existing.projectCode,
      },
      after: {
        role: updated.role,
        orgUnitId: updated.orgUnitId,
        orgScopeIds: updated.orgScopes.map((scope) => scope.orgUnitId),
        projectCode: updated.projectCode,
      },
    },
  });

  return NextResponse.json({
    ok: true,
    user: {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      orgUnitId: updated.orgUnitId,
      orgUnitName: updated.orgUnit?.name ?? null,
      orgScopeIds: updated.orgScopes.map((scope) => scope.orgUnitId),
      orgScopeNames: updated.orgScopes.map((scope) => scope.orgUnit.name),
      projectCode: updated.projectCode,
    },
  });
}
