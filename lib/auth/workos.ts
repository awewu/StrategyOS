/**
 * WorkOS AuthKit / SSO — env-gated; syncs users to Prisma on login.
 */
import { dbAvailable, prisma } from "@/lib/db";
import { DEMO_USERS, type SessionPayload } from "@/lib/auth/config";
import type { RoleKey } from "@/lib/constants";

const WORKOS_API = "https://api.workos.com";
export const WORKOS_STATE_COOKIE = "stratos_workos_state";

export function workosRedirectUri(origin: string): string {
  return process.env.WORKOS_REDIRECT_URI ?? `${origin}/api/auth/callback`;
}

export function buildWorkOSAuthorizeUrl(
  origin: string,
  next = "/command"
): { url: string; state: string } | null {
  const clientId = process.env.WORKOS_CLIENT_ID;
  if (!clientId) return null;

  const redirectUri = workosRedirectUri(origin);
  const state = Buffer.from(JSON.stringify({ next, n: crypto.randomUUID() }), "utf8").toString(
    "base64url"
  );

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    provider: "authkit",
    state,
  });

  const org = process.env.WORKOS_ORGANIZATION_ID;
  if (org) params.set("organization_id", org);

  return {
    url: `${WORKOS_API}/user_management/authorize?${params.toString()}`,
    state,
  };
}

export function parseWorkOSState(state: string | null): { next: string } {
  if (!state) return { next: "/command" };
  try {
    const parsed = JSON.parse(Buffer.from(state, "base64url").toString("utf8")) as {
      next?: string;
    };
    const next = parsed.next?.startsWith("/") ? parsed.next : "/command";
    return { next };
  } catch {
    return { next: "/command" };
  }
}

export async function exchangeWorkOSCode(
  code: string,
  origin: string
): Promise<SessionPayload | null> {
  const clientId = process.env.WORKOS_CLIENT_ID;
  const apiKey = process.env.WORKOS_API_KEY;
  if (!clientId || !apiKey) return null;

  const res = await fetch(`${WORKOS_API}/user_management/authenticate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: apiKey,
      grant_type: "authorization_code",
      code,
      redirect_uri: workosRedirectUri(origin),
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error("WorkOS authenticate failed:", res.status, errText.slice(0, 200));
    return null;
  }

  const data = (await res.json()) as {
    user?: {
      id: string;
      email: string;
      first_name?: string;
      last_name?: string;
    };
  };
  const user = data.user;
  if (!user?.email) return null;

  return syncWorkOSUser({
    workosId: user.id,
    email: user.email,
    name: [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email,
  });
}

export async function syncWorkOSUser(input: {
  workosId: string;
  email: string;
  name: string;
}): Promise<SessionPayload> {
  const email = input.email.toLowerCase();

  if (await dbAvailable()) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return {
        userId: existing.id,
        email: existing.email,
        name: existing.name,
        role: existing.role as RoleKey,
      };
    }

    const role = inferRoleFromEmail(email);
    const created = await prisma.user.create({
      data: { email, name: input.name.slice(0, 50), role },
    });
    return {
      userId: created.id,
      email: created.email,
      name: created.name,
      role: created.role as RoleKey,
    };
  }

  const demo = DEMO_USERS.find((u) => u.email === email);
  if (demo) return demo;

  return {
    userId: input.workosId,
    email,
    name: input.name,
    role: inferRoleFromEmail(email),
  };
}

function inferRoleFromEmail(email: string): RoleKey {
  if (email.includes("ceo")) return "ceo";
  if (email.includes("cfo")) return "cfo";
  if (email.includes("vp")) return "vp";
  if (email.includes("system")) return "system_head";
  if (email.includes("pm")) return "pm";
  if (email.includes("staff")) return "staff";
  return "observer";
}
