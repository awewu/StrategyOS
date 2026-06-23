import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { logUsageEvent } from "@/lib/audit/log-event";
import { resolvePublicOrigin } from "@/lib/auth/config";
import {
  ROLE_COOKIE,
  SESSION_COOKIE,
  encodeSession,
  roleCookieOptions,
  sessionCookieOptions,
} from "@/lib/auth/session";
import {
  decodeTandemState,
  exchangeTandemCode,
  TANDEM_STATE_COOKIE,
} from "@/lib/auth/tandem";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = resolvePublicOrigin(request);
  const code = searchParams.get("code");
  const returnedState = searchParams.get("state");
  const oidcError = searchParams.get("error");

  if (oidcError) {
    await logUsageEvent({
      action: "auth_failed",
      resource: "tandem_callback",
      request,
      metadata: { reason: oidcError },
    });
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(oidcError)}`, origin));
  }

  const cookieStore = await cookies();
  const auth = decodeTandemState(cookieStore.get(TANDEM_STATE_COOKIE)?.value);

  const clearState = (res: NextResponse) => {
    res.cookies.set(TANDEM_STATE_COOKIE, "", { maxAge: 0, path: "/" });
    return res;
  };

  if (!auth || !returnedState || returnedState !== auth.state) {
    await logUsageEvent({
      action: "auth_failed",
      resource: "tandem_callback",
      request,
      metadata: { reason: "state_mismatch" },
    });
    return clearState(NextResponse.redirect(new URL("/login?error=state_mismatch", origin)));
  }

  if (!code) {
    return clearState(NextResponse.redirect(new URL("/login?error=missing_code", origin)));
  }

  const user = await exchangeTandemCode(code, origin, auth);
  if (!user) {
    await logUsageEvent({
      action: "auth_failed",
      resource: "tandem_callback",
      request,
      metadata: { reason: "exchange_failed" },
    });
    return clearState(
      NextResponse.redirect(new URL("/login?error=tandem_exchange_failed", origin)),
    );
  }

  await logUsageEvent({
    action: "login",
    resource: user.email,
    request,
    userEmail: user.email,
    userId: user.userId,
    metadata: { role: user.role, method: "tandem" },
  });

  const res = NextResponse.redirect(new URL(auth.next, origin));
  res.cookies.set(SESSION_COOKIE, encodeSession(user), sessionCookieOptions());
  res.cookies.set(ROLE_COOKIE, user.role, roleCookieOptions());
  return clearState(res);
}
