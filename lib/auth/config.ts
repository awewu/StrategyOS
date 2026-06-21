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
  projectCode?: string | null;
}

export function authRequired(): boolean {
  return process.env.STRATOS_REQUIRE_AUTH === "1";
}

export function workosConfigured(): boolean {
  return Boolean(process.env.WORKOS_CLIENT_ID && process.env.WORKOS_API_KEY);
}

/** Demo users when DB unavailable */
export const DEMO_USERS: SessionPayload[] = [
  { userId: "demo-ceo", email: "ceo@rheem.cn", name: "铁山", role: "ceo", orgUnitId: null, projectCode: null },
  { userId: "demo-vp", email: "vp@rheem.cn", name: "毕韬", role: "vp", orgUnitId: "org-exec-hw", projectCode: null },
  { userId: "demo-pm", email: "pm@rheem.cn", name: "张健", role: "pm", orgUnitId: "org-exec-hw", projectCode: "V4" },
  { userId: "demo-staff", email: "staff@rheem.cn", name: "战略组", role: "staff", orgUnitId: null, projectCode: null },
];
