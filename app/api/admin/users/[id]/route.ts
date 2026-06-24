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
    orgUnitId?: unknown;
    projectCode?: unknown;
  };

  if (typeof body.role !== "string" || !(body.role in ROLES)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const orgUnitId = parseNullableString(body.orgUnitId);
  const projectCode = parseNullableString(body.projectCode);
  if (orgUnitId === undefined || projectCode === undefined) {
    return NextResponse.json({ error: "Invalid scope payload" }, { status: 400 });
  }

  if (projectCode && !PROJECT_CODES.includes(projectCode as (typeof PROJECT_CODES)[number])) {
    return NextResponse.json({ error: "Invalid projectCode" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, role: true, orgUnitId: true, projectCode: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (orgUnitId) {
    const org = await prisma.orgUnit.findUnique({
      where: { id: orgUnitId },
      select: { id: true },
    });
    if (!org) return NextResponse.json({ error: "Org unit not found" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      role: body.role as RoleKey,
      orgUnitId,
      projectCode,
    },
    include: { orgUnit: { select: { name: true } } },
  });

  await logUsageEvent({
    action: "permission_update",
    resource: updated.email,
    request,
    metadata: {
      before: {
        role: existing.role,
        orgUnitId: existing.orgUnitId,
        projectCode: existing.projectCode,
      },
      after: {
        role: updated.role,
        orgUnitId: updated.orgUnitId,
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
      projectCode: updated.projectCode,
    },
  });
}
