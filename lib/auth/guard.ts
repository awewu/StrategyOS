import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ROLE_COOKIE, type SessionPayload } from "@/lib/auth/config";
import {
  canAccessRoute,
  isAdmin,
  roleHomePath,
  roleToLevel,
  type AccessLevel,
} from "@/lib/auth/permissions";
import { loadPermissionConfigFromDb } from "@/lib/auth/permission-config";
import { resolveEffectiveRole, shouldEnforceRoutePermissions } from "@/lib/auth/resolve-role";
import { getSession } from "@/lib/auth/session";
import type { RoleKey } from "@/lib/constants";

export function parseRole(value: string | undefined): RoleKey {
  return resolveEffectiveRole({ cookieRole: value });
}

export async function getEffectiveRole(): Promise<RoleKey> {
  const session = await getSession();
  const cookieStore = await cookies();
  return resolveEffectiveRole({
    sessionRole: session?.role ?? null,
    cookieRole: cookieStore.get(ROLE_COOKIE)?.value,
  });
}

export async function getEffectiveSession(): Promise<SessionPayload | null> {
  return getSession();
}

export async function requireMinLevel(
  minLevel: AccessLevel,
  options?: { redirectTo?: string; pathname?: string },
): Promise<RoleKey> {
  const role = await getEffectiveRole();
  if (!shouldEnforceRoutePermissions() || roleToLevel(role) >= minLevel) return role;

  const home = options?.redirectTo ?? `${roleHomePath(role)}?denied=1`;
  redirect(home);
}

export async function requireRouteAccess(pathname: string): Promise<RoleKey> {
  const role = await getEffectiveRole();
  const config = await loadPermissionConfigFromDb();
  if (!shouldEnforceRoutePermissions() || canAccessRoute(role, pathname, config)) return role;
  redirect(`${roleHomePath(role)}?denied=1`);
}

export async function requireAdmin(): Promise<RoleKey> {
  const role = await getEffectiveRole();
  const config = await loadPermissionConfigFromDb();
  if (!shouldEnforceRoutePermissions() || isAdmin(role, config)) return role;
  redirect(`${roleHomePath(role)}?denied=1`);
}
