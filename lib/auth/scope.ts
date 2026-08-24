import type { SessionPayload } from "@/lib/auth/config";
import type { RoleKey } from "@/lib/constants";
import { roleToLevel } from "@/lib/auth/permissions";
import {
  BU_SLICES,
  FUNCTION_SLICES,
  getSliceByIdGlobal,
  type OrgSlice,
} from "@/lib/monitor/org-slices";

/** Demo org-unit scope when User.orgUnitId is not set. */
const DEMO_ORG_SCOPE: Record<RoleKey, string[] | null> = {
  ceo: null,
  cfo: ["org-exec-finance"],
  staff: null,
  vp: ["org-exec-hw"],
  system_head: ["org-exec-rd"],
  pm: ["org-exec-hw"],
  observer: ["org-exec-hw"],
  board: null,
};

const DEMO_PROJECT_SCOPE: Record<RoleKey, string[] | null> = {
  ceo: null,
  cfo: null,
  staff: null,
  vp: null,
  system_head: null,
  pm: ["V4"],
  observer: null,
  board: null,
};

export function getOrgScope(role: RoleKey, session?: SessionPayload | null): string[] | null {
  if (roleToLevel(role) >= 3) return null;
  if (session?.orgScopeIds && session.orgScopeIds.length > 0) return session.orgScopeIds;
  if (session?.orgUnitId) return [session.orgUnitId];
  return DEMO_ORG_SCOPE[role];
}

export function getProjectScope(role: RoleKey, session?: SessionPayload | null): string[] | null {
  if (roleToLevel(role) >= 2 && role !== "pm") return null;
  if (session?.projectCode) return [session.projectCode];
  return DEMO_PROJECT_SCOPE[role];
}

/** Minimal session shape the client needs to resolve a viewer's real scope. */
export type ScopeSession = Pick<SessionPayload, "orgUnitId" | "orgScopeIds" | "projectCode">;

export type ScopeLabels = { orgLabels: string[]; projectCodes: string[] };

/**
 * Human-readable scope for a viewer — the real org-unit name(s) and project
 * code(s) they are limited to. Empty `orgLabels` means full-company scope.
 * Pure + isomorphic: usable server-side (real session) and client-side (demo
 * role, session omitted → falls back to the role's demo scope).
 */
export function resolveScopeLabels(role: RoleKey, session?: ScopeSession | null): ScopeLabels {
  const orgIds = getOrgScope(role, session as SessionPayload | null);
  const projects = getProjectScope(role, session as SessionPayload | null);
  const orgLabels = (orgIds ?? [])
    .map((id) => getSliceByIdGlobal(id)?.slice.label ?? null)
    .filter((label): label is string => Boolean(label));
  return { orgLabels, projectCodes: projects ?? [] };
}

export function orgScopeWhere(orgIds: string[] | null): { orgUnitId?: { in: string[] } } {
  if (orgIds == null) return {};
  return { orgUnitId: { in: orgIds } };
}

export function projectCodeInScope(code: string, projectScope: string[] | null): boolean {
  if (projectScope == null) return true;
  return projectScope.includes(code);
}

export function sliceInOrgScope(sliceId: string, orgScope: string[] | null): boolean {
  if (orgScope == null) return true;
  return orgScope.includes(sliceId);
}

export function defaultMonitorSlice(role: RoleKey, session?: SessionPayload | null): OrgSlice | null {
  const orgScope = getOrgScope(role, session);
  if (orgScope == null || orgScope.length === 0) return null;
  const id = orgScope[0]!;
  return (
    BU_SLICES.find((s) => s.id === id) ??
    FUNCTION_SLICES.find((s) => s.id === id) ??
    null
  );
}

export function assertSliceAccess(
  role: RoleKey,
  sliceId: string | undefined,
  session?: SessionPayload | null,
): string | null {
  const orgScope = getOrgScope(role, session);
  if (orgScope == null || !sliceId) return sliceId ?? null;

  if (sliceInOrgScope(sliceId, orgScope)) return sliceId;

  return orgScope[0] ?? null;
}

export function monitorBasePathForRole(role: RoleKey, session?: SessionPayload | null): string {
  const level = roleToLevel(role);
  if (level >= 3) return "/monitor/bu";
  const slice = defaultMonitorSlice(role, session);
  if (!slice) return "/monitor/bu";
  const isBu = BU_SLICES.some((s) => s.id === slice.id);
  return isBu ? `/monitor/bu?unit=${slice.id}` : `/monitor/functions?unit=${slice.id}`;
}

export function resolveScopedSlice(
  role: RoleKey,
  unit: string | undefined,
  kind: "function" | "bu",
  session?: SessionPayload | null,
): OrgSlice | null {
  const resolved = getSliceByIdGlobal(unit);
  const sliceId = unit ?? resolved?.slice.id;
  if (!sliceId) return resolved?.slice ?? null;

  const allowed = assertSliceAccess(role, sliceId, session);
  if (!allowed) return null;
  if (allowed !== sliceId) {
    return getSliceByIdGlobal(allowed)?.slice ?? null;
  }
  return resolved?.slice ?? null;
}
