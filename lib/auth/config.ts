import type { RoleKey } from "@/lib/constants";

export const SESSION_COOKIE = "stratos_session";
export const ROLE_COOKIE = "stratos_role";
export const USER_COOKIE = "stratos_user";

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: RoleKey;
  orgUnitId?: string | null;
  orgScopeIds?: string[] | null;
  projectCode?: string | null;
}

export function authRequired(): boolean {
  return process.env.STRATOS_REQUIRE_AUTH === "1";
}

export function workosConfigured(): boolean {
  return Boolean(process.env.WORKOS_CLIENT_ID && process.env.WORKOS_API_KEY);
}

export function tandemConfigured(): boolean {
  return Boolean(process.env.TANDEM_CLIENT_ID && process.env.TANDEM_CLIENT_SECRET);
}

/** Demo email login — disabled when production auth requires WorkOS SSO. */
export function demoLoginAllowed(): boolean {
  return !(authRequired() && workosConfigured());
}

/**
 * Public-facing origin for building auth redirects. Behind a reverse proxy the
 * request host is the internal address (e.g. localhost:3050), so prefer the
 * configured public URL, then forwarded headers, then the request origin.
 */
export function resolvePublicOrigin(request: Request): string {
  const configured = process.env.STRATOS_PUBLIC_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");

  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost) {
    const proto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
    return `${proto}://${forwardedHost.split(",")[0]?.trim()}`;
  }

  return new URL(request.url).origin;
}

/** Demo users when DB unavailable */
export const DEMO_USERS: SessionPayload[] = [
  { userId: "demo-ceo", email: "ceo@rheem.cn", name: "铁山", role: "ceo", orgUnitId: null, projectCode: null },
  { userId: "demo-cfo", email: "cfo@rheem.cn", name: "陈静", role: "cfo", orgUnitId: "org-exec-finance", projectCode: null },
  { userId: "demo-vp", email: "vp@rheem.cn", name: "毕韬", role: "vp", orgUnitId: "org-exec-hw", projectCode: null },
  { userId: "demo-system-head", email: "system-head@rheem.cn", name: "研发总监", role: "system_head", orgUnitId: "org-exec-rd", projectCode: null },
  { userId: "demo-pm", email: "pm@rheem.cn", name: "张健", role: "pm", orgUnitId: "org-exec-hw", projectCode: "V4" },
  { userId: "demo-staff", email: "staff@rheem.cn", name: "战略组", role: "staff", orgUnitId: null, projectCode: null },
];
