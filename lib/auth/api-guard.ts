import { NextResponse } from "next/server";
import { getEffectiveRole, getEffectiveSession } from "@/lib/auth/guard";
import { isAdmin, roleToLevel, type AccessLevel } from "@/lib/auth/permissions";
import { loadPermissionConfigFromDb } from "@/lib/auth/permission-config";
import { isDevBypassAuth, shouldEnforceRoutePermissions } from "@/lib/auth/resolve-role";

/**
 * 变更类 API 的最小闸门：在强制模式（生产）下要求存在已认证 session。
 * 修复隐患——生产未登录时 resolveEffectiveRole 会把匿名默认成 ceo，从而通过 requireApiMinLevel。
 * 本地 dev bypass 放行以便开发。
 */
export async function requireMutationGate(): Promise<NextResponse | null> {
  if (isDevBypassAuth()) return null;
  const session = await getEffectiveSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  return null;
}

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
