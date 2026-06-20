import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { logUsageEvent } from "@/lib/audit/log-event";
import { ROLE_COOKIE, SESSION_COOKIE, encodeSession, roleCookieOptions, sessionCookieOptions } from "@/lib/auth/session";
import { exchangeWorkOSCode, parseWorkOSState, WORKOS_STATE_COOKIE } from "@/lib/auth/workos";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const { next } = parseWorkOSState(state);

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(WORKOS_STATE_COOKIE)?.value;
  if (state && expectedState && state !== expectedState) {
    await logUsageEvent({
      action: "auth_failed",
      resource: "workos_callback",
      request,
      metadata: { reason: "state_mismatch" },
    });
    return NextResponse.redirect(new URL("/login?error=state_mismatch", origin));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", origin));
  }

  const user = await exchangeWorkOSCode(code, origin);
  if (!user) {
    await logUsageEvent({
      action: "auth_failed",
      resource: "workos_callback",
      request,
      metadata: { reason: "exchange_failed" },
    });
    return NextResponse.redirect(new URL("/login?error=workos_exchange_failed", origin));
  }

  await logUsageEvent({
    action: "login",
    resource: user.email,
    request,
    userEmail: user.email,
    userId: user.userId,
    metadata: { role: user.role, method: "workos" },
  });

  const res = NextResponse.redirect(new URL(next, origin));
  res.cookies.set(SESSION_COOKIE, encodeSession(user), sessionCookieOptions());
  res.cookies.set(ROLE_COOKIE, user.role, roleCookieOptions());
  res.cookies.set(WORKOS_STATE_COOKIE, "", { maxAge: 0, path: "/" });
  return res;
}
