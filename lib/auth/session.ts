import { cookies } from "next/headers";
import { dbAvailable, prisma } from "@/lib/db";
import {
  DEMO_USERS,
  ROLE_COOKIE,
  SESSION_COOKIE,
  USER_COOKIE,
  type SessionPayload,
} from "@/lib/auth/config";
import type { RoleKey } from "@/lib/constants";

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const payload = JSON.parse(Buffer.from(token, "base64url").toString("utf8")) as SessionPayload;
    return payload;
  } catch {
    return null;
  }
}

export function encodeSession(payload: SessionPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export async function resolveUserByEmail(email: string): Promise<SessionPayload | null> {
  const demo = DEMO_USERS.find((u) => u.email === email);
  if (!(await dbAvailable())) return demo ?? null;

  const row = await prisma.user.findUnique({ where: { email } });
  if (!row) return demo ?? null;
  return {
    userId: row.id,
    email: row.email,
    name: row.name,
    role: row.role as RoleKey,
  };
}

export function sessionCookieOptions(maxAge = 60 * 60 * 24 * 7) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
    secure: process.env.NODE_ENV === "production",
  };
}

export function roleCookieOptions(maxAge = 60 * 60 * 24 * 365) {
  return {
    httpOnly: false,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
    secure: process.env.NODE_ENV === "production",
  };
}

export { ROLE_COOKIE, SESSION_COOKIE, USER_COOKIE };
