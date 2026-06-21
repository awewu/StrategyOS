import { NextResponse, type NextRequest } from "next/server";
import { authRequired, ROLE_COOKIE, SESSION_COOKIE } from "@/lib/auth/config";
import {
  canAccessRoute,
  roleHomePath,
  type RoleKey,
} from "@/lib/auth/permissions";
import { resolveEffectiveRole, shouldEnforceRoutePermissions } from "@/lib/auth/resolve-role";

const PUBLIC = [
  "/login",
  "/brand",
  "/api/auth/login",
  "/api/auth/workos",
  "/api/auth/callback",
  "/api/auth/workos/webhook",
  "/api/health",
  "/api/harness",
  "/api/audit/log",
];

function roleFromRequest(request: NextRequest): RoleKey {
  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;
  let sessionRole: RoleKey | null = null;
  if (sessionToken) {
    try {
      const payload = JSON.parse(
        Buffer.from(sessionToken, "base64url").toString("utf8"),
      ) as { role?: string };
      if (payload.role) sessionRole = payload.role as RoleKey;
    } catch {
      // fall through
    }
  }
  return resolveEffectiveRole({
    sessionRole,
    cookieRole: request.cookies.get(ROLE_COOKIE)?.value,
  });
}

function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function logAuthFailure(request: NextRequest, pathname: string, reason: string) {
  fetch(new URL("/api/audit/log", request.url), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-stratos-internal": "1",
    },
    body: JSON.stringify({
      action: "auth_failed",
      resource: pathname,
      metadata: { reason },
    }),
  }).catch(() => {});
}

function permissionDenied(request: NextRequest, role: RoleKey) {
  const url = request.nextUrl.clone();
  url.pathname = roleHomePath(role);
  url.searchParams.set("denied", "1");
  return NextResponse.redirect(url);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const role = roleFromRequest(request);

  if (shouldEnforceRoutePermissions() && !canAccessRoute(role, pathname)) {
    return permissionDenied(request, role);
  }

  if (!authRequired()) return NextResponse.next();

  if (pathname.startsWith("/api/") && pathname !== "/api/auth/login") {
    const session = request.cookies.get(SESSION_COOKIE)?.value;
    if (!session) {
      logAuthFailure(request, pathname, "api_unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  const session = request.cookies.get(SESSION_COOKIE)?.value;
  if (!session && !pathname.startsWith("/print")) {
    logAuthFailure(request, pathname, "redirect_login");
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
