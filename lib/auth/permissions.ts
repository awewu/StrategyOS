/**
 * StratOS route permission matrix.
 *
 * Access levels (higher includes lower):
 * L0 observer — published one-pager, own-unit monitor (read-only)
 * L1 pm       — + execution, commitments, own project Vx
 * L2 vp/system_head/staff — + own slice monitor, own org OPS, draft strategy input
 * L3 ceo/cfo  — command deck, inbox, FPA, compass, market, version diff (full company)
 * L4 admin    — access management, org master, system config (ceo + cfo)
 */

import type { RoleKey } from "@/lib/constants";
import {
  effectiveMinLevel,
  getPermissionConfig,
  isAdminRole,
  isExecutiveRole,
  type PermissionConfig,
} from "./permission-config";

export type { RoleKey };
export type { PermissionConfig };
export type AccessLevel = 0 | 1 | 2 | 3 | 4;

export type RoutePermissionRule = {
  prefix: string;
  minLevel: AccessLevel;
  /** Match pathname exactly (not prefix), e.g. /strategy without /strategy/input */
  exact?: boolean;
  adminOnly?: boolean;
};

/** Longest prefix first — first match wins. */
export const ROUTE_PERMISSIONS: RoutePermissionRule[] = [
  { prefix: "/admin", minLevel: 4, adminOnly: true },
  { prefix: "/api/print", minLevel: 3 },
  { prefix: "/print/panorama", minLevel: 3 },
  { prefix: "/strategy/submissions", minLevel: 2 },
  { prefix: "/strategy/input", minLevel: 2 },
  { prefix: "/strategy", minLevel: 0, exact: true },
  { prefix: "/command", minLevel: 3 },
  { prefix: "/inbox", minLevel: 3 },
  { prefix: "/compass", minLevel: 3 },
  { prefix: "/outlook", minLevel: 3 },
  { prefix: "/versions", minLevel: 3 },
  { prefix: "/cockpit", minLevel: 2 },
  { prefix: "/mandates", minLevel: 2 },
  { prefix: "/finance", minLevel: 3 },
  { prefix: "/fpa", minLevel: 3 },
  { prefix: "/decode", minLevel: 2 },
  { prefix: "/innovation", minLevel: 2 },
  { prefix: "/ma", minLevel: 3 },
  { prefix: "/market", minLevel: 2 },
  { prefix: "/reports", minLevel: 2 },
  { prefix: "/ops", minLevel: 2 },
  { prefix: "/tools", minLevel: 2 },
  { prefix: "/rehearsal", minLevel: 2 },
  { prefix: "/gates", minLevel: 2 },
  { prefix: "/monitor", minLevel: 0 },
  { prefix: "/execution", minLevel: 1 },
  { prefix: "/health", minLevel: 0 },
  { prefix: "/culture", minLevel: 0 },
  { prefix: "/brand", minLevel: 0 },
];

const HUB_MIN_LEVEL: Record<string, AccessLevel> = {
  posture: 0,
  formulate: 2,
  ops: 2,
  operate: 0,
  tools: 2,
  decode: 2,
  finance: 3,
  market: 2,
  culture: 0,
  access: 4,
};

export function roleToLevel(role: RoleKey): AccessLevel {
  switch (role) {
    case "observer":
      return 0;
    case "pm":
      return 1;
    case "vp":
    case "system_head":
    case "staff":
      return 2;
    case "ceo":
    case "cfo":
      return 3;
    default: {
      const _exhaustive: never = role;
      return _exhaustive;
    }
  }
}

export function isAdmin(role: RoleKey, config = getPermissionConfig()): boolean {
  return isAdminRole(role, config);
}

export function isExecutive(role: RoleKey, config = getPermissionConfig()): boolean {
  return isExecutiveRole(role, config);
}

export function roleHomePath(role: RoleKey): string {
  switch (role) {
    case "ceo":
      return "/command";
    case "cfo":
      return "/finance";
    case "observer":
      return "/strategy";
    case "vp":
      return "/cockpit";
    case "system_head":
      return "/cockpit";
    case "pm":
      return "/execution";
    case "staff":
      return "/reports";
    default:
      return "/strategy";
  }
}

function matchesRule(pathname: string, rule: RoutePermissionRule): boolean {
  if (rule.exact) return pathname === rule.prefix;
  return pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`);
}

export function getMatchingRule(pathname: string): RoutePermissionRule | null {
  for (const rule of ROUTE_PERMISSIONS) {
    if (matchesRule(pathname, rule)) return rule;
  }
  return null;
}

export function getRequiredLevel(pathname: string): AccessLevel | null {
  return getMatchingRule(pathname)?.minLevel ?? null;
}

export function minRoleForPath(pathname: string): RoleKey | null {
  const level = getRequiredLevel(pathname);
  if (level == null) return null;
  const roles: RoleKey[] = ["observer", "pm", "vp", "system_head", "staff", "cfo", "ceo"];
  return roles.find((r) => roleToLevel(r) >= level) ?? "ceo";
}

export function canAccessRoute(role: RoleKey, pathname: string, config = getPermissionConfig()): boolean {
  const rule = getMatchingRule(pathname);
  if (!rule) return true;

  if (rule.adminOnly) return isAdmin(role, config);

  return roleToLevel(role) >= effectiveMinLevel(rule.minLevel, config);
}

export function canAccessHub(role: RoleKey, hubId: string, config = getPermissionConfig()): boolean {
  const minLevel = HUB_MIN_LEVEL[hubId];
  if (minLevel == null) return true;
  if (hubId === "access") return isAdmin(role, config);
  return roleToLevel(role) >= effectiveMinLevel(minLevel, config);
}

/** Draft one-pager content visible to editors (ceo/cfo), not read-only roles. */
export function canViewDraftOnePager(role: RoleKey): boolean {
  return role === "ceo" || role === "cfo";
}

export function filterNavHref(role: RoleKey, href: string): boolean {
  const pathOnly = href.split("?")[0]!;
  return canAccessRoute(role, pathOnly);
}
