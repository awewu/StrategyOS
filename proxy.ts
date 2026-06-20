import { NextResponse, type NextRequest } from "next/server";
import { authRequired, SESSION_COOKIE } from "@/lib/auth/config";

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

export function proxy(request: NextRequest) {
  if (!authRequired()) return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (PUBLIC.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }
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
