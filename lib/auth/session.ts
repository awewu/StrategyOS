import crypto from "crypto";
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

function sessionSecret(): string | undefined {
  return process.env.STRATOS_SESSION_SECRET?.trim() || undefined;
}

/** Parse signed or unsigned session token (shared by cookies + proxy). */
export function decodeSessionToken(token: string): SessionPayload | null {
  const secret = sessionSecret();
  let body = token;

  if (secret) {
    const dot = token.lastIndexOf(".");
    if (dot <= 0) return null;
    body = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const expected = crypto.createHmac("sha256", secret).update(body).digest("base64url");
    try {
      if (sig.length !== expected.length) return null;
      if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    } catch {
      return null;
    }
  }

  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return decodeSessionToken(token);
}

export function encodeSession(payload: SessionPayload): string {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const secret = sessionSecret();
  if (!secret) return body;
  const sig = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export async function resolveUserByEmail(email: string): Promise<SessionPayload | null> {
  const demo = DEMO_USERS.find((u) => u.email === email);
  if (!(await dbAvailable())) return demo ?? null;

  const row = await prisma.user.findUnique({
    where: { email },
    include: { orgScopes: { select: { orgUnitId: true } } },
  });
  if (!row) return demo ?? null;
  return {
    userId: row.id,
    email: row.email,
    name: row.name,
    role: row.role as RoleKey,
    orgUnitId: row.orgUnitId,
    orgScopeIds: row.orgScopes.map((scope) => scope.orgUnitId),
    projectCode: row.projectCode,
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
