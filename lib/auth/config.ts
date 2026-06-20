import type { RoleKey } from "@/lib/constants";

export const SESSION_COOKIE = "stratos_session";
export const ROLE_COOKIE = "stratos_role";
export const USER_COOKIE = "stratos_user";

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: RoleKey;
}

export function authRequired(): boolean {
  return process.env.STRATOS_REQUIRE_AUTH === "1";
}

export function workosConfigured(): boolean {
  return Boolean(process.env.WORKOS_CLIENT_ID && process.env.WORKOS_API_KEY);
}

/** Demo users when DB unavailable */
export const DEMO_USERS: SessionPayload[] = [
  { userId: "demo-ceo", email: "ceo@rheem.cn", name: "铁山", role: "ceo" },
  { userId: "demo-vp", email: "vp@rheem.cn", name: "毕韬", role: "vp" },
  { userId: "demo-pm", email: "pm@rheem.cn", name: "张健", role: "pm" },
  { userId: "demo-staff", email: "staff@rheem.cn", name: "战略组", role: "staff" },
];
