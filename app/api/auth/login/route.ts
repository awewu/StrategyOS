import { NextResponse } from "next/server";
import { logUsageEvent } from "@/lib/audit/log-event";
import { DEMO_USERS, demoLoginAllowed, workosConfigured } from "@/lib/auth/config";
import {
  encodeSession,
  getSession,
  resolveUserByEmail,
  ROLE_COOKIE,
  SESSION_COOKIE,
  roleCookieOptions,
  sessionCookieOptions,
} from "@/lib/auth/session";

export async function POST(request: Request) {
  if (!demoLoginAllowed()) {
    return NextResponse.json(
      { error: "demo login disabled — use WorkOS SSO" },
      { status: 403 },
    );
  }

  const body = (await request.json()) as { email?: string };
  const email = body.email?.trim();
  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const user = await resolveUserByEmail(email);
  if (!user) {
    await logUsageEvent({
      action: "auth_failed",
      resource: email,
      request,
      userEmail: email,
    });
    return NextResponse.json({ error: "user not found" }, { status: 404 });
  }

  await logUsageEvent({
    action: "login",
    resource: email,
    request,
    userEmail: user.email,
    userId: user.userId,
    metadata: { role: user.role, method: "demo" },
  });

  const res = NextResponse.json({ ok: true, user: { name: user.name, role: user.role } });
  res.cookies.set(SESSION_COOKIE, encodeSession(user), sessionCookieOptions());
  res.cookies.set(ROLE_COOKIE, user.role, roleCookieOptions());
  return res;
}

export async function GET() {
  return NextResponse.json({
    demoUsers: DEMO_USERS.map((u) => ({ email: u.email, name: u.name, role: u.role })),
    workosReady: workosConfigured(),
    requireAuth: process.env.STRATOS_REQUIRE_AUTH === "1",
    demoLoginAllowed: demoLoginAllowed(),
  });
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (session) {
    await logUsageEvent({
      action: "logout",
      resource: session.email,
      request,
      userEmail: session.email,
      userId: session.userId,
    });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(0), maxAge: 0 });
  res.cookies.set(ROLE_COOKIE, "", { ...roleCookieOptions(0), maxAge: 0 });
  return res;
}
