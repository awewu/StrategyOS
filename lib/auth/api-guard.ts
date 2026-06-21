import { NextResponse } from "next/server";
import { getEffectiveRole } from "@/lib/auth/guard";
import { roleToLevel, type AccessLevel } from "@/lib/auth/permissions";
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
  if (canAccessRoute(role, pathname)) return null;
  return NextResponse.json({ error: "Forbidden", role }, { status: 403 });
}
