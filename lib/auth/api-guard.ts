import { NextResponse } from "next/server";
import { getEffectiveRole } from "@/lib/auth/guard";
import { isAdmin, roleToLevel, type AccessLevel } from "@/lib/auth/permissions";
import { loadPermissionConfigFromDb } from "@/lib/auth/permission-config";
import { shouldEnforceRoutePermissions } from "@/lib/auth/resolve-role";

export async function requireApiMinLevel(minLevel: AccessLevel): Promise<NextResponse | null> {
  if (!shouldEnforceRoutePermissions()) return null;

  const role = await getEffectiveRole();
  if (roleToLevel(role) >= minLevel) return null;
  return NextResponse.json({ error: "Forbidden", role }, { status: 403 });
}

export async function requireApiRoute(pathname: string): Promise<NextResponse | null> {
  if (!shouldEnforceRoutePermissions()) return null;

  const { canAccessRoute } = await import("@/lib/auth/permissions");
  const role = await getEffectiveRole();
  const config = await loadPermissionConfigFromDb();
  if (canAccessRoute(role, pathname, config)) return null;
  return NextResponse.json({ error: "Forbidden", role }, { status: 403 });
}

export async function requireApiAdmin(): Promise<NextResponse | null> {
  if (!shouldEnforceRoutePermissions()) return null;

  const role = await getEffectiveRole();
  const config = await loadPermissionConfigFromDb();
  if (isAdmin(role, config)) return null;
  return NextResponse.json({ error: "Forbidden — admin required", role }, { status: 403 });
}
