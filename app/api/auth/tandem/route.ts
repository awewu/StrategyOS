import { NextResponse } from "next/server";
import { resolvePublicOrigin } from "@/lib/auth/config";
import {
  buildTandemAuthorizeUrl,
  encodeTandemState,
  TANDEM_STATE_COOKIE,
} from "@/lib/auth/tandem";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = resolvePublicOrigin(request);
  const next = url.searchParams.get("next") ?? "/command";
  const built = await buildTandemAuthorizeUrl(origin, next);

  if (!built) {
    return NextResponse.json(
      { error: "Tandem SSO not configured. Set TANDEM_CLIENT_ID and TANDEM_CLIENT_SECRET." },
      { status: 501 },
    );
  }

  const res = NextResponse.redirect(built.url);
  res.cookies.set(TANDEM_STATE_COOKIE, encodeTandemState(built.state), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
