import { NextResponse } from "next/server";
import { buildWorkOSAuthorizeUrl, WORKOS_STATE_COOKIE } from "@/lib/auth/workos";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const next = url.searchParams.get("next") ?? "/command";
  const built = buildWorkOSAuthorizeUrl(origin, next);

  if (!built) {
    return NextResponse.json(
      { error: "WorkOS not configured. Set WORKOS_CLIENT_ID and WORKOS_API_KEY." },
      { status: 501 }
    );
  }

  const res = NextResponse.redirect(built.url);
  res.cookies.set(WORKOS_STATE_COOKIE, built.state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
