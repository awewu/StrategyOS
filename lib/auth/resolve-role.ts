import { ROLES, type RoleKey } from "@/lib/constants";

/** Dev/local without STRATOS_REQUIRE_AUTH — full modules, default CEO. */
export function isDevBypassAuth(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.STRATOS_REQUIRE_AUTH !== "1";
}

export function shouldEnforceRoutePermissions(): boolean {
  return !isDevBypassAuth();
}

export function parseRoleKey(value: string | undefined): RoleKey {
  if (value && value in ROLES) return value as RoleKey;
  return "ceo";
}

/** Session > STRATOS_DEV_ROLE > dev CEO default > cookie > ceo */
export function resolveEffectiveRole(opts: {
  sessionRole?: RoleKey | null;
  cookieRole?: string | null;
}): RoleKey {
  if (opts.sessionRole && opts.sessionRole in ROLES) {
    return opts.sessionRole;
  }

  if (isDevBypassAuth()) {
    const forced = process.env.STRATOS_DEV_ROLE;
    if (forced && forced in ROLES) return forced as RoleKey;
    return "ceo";
  }

  return parseRoleKey(opts.cookieRole ?? undefined);
}
