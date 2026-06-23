import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requireApiMinLevel } from "@/lib/auth/api-guard";
import type { SessionPayload } from "@/lib/auth/config";
import { ROLE_COOKIE, SESSION_COOKIE } from "@/lib/auth/config";
import { resolveEffectiveRole } from "@/lib/auth/resolve-role";
import { getOrgScope, orgScopeWhere } from "@/lib/auth/scope";
import { dbAvailable } from "@/lib/db";
import { getReportDetail } from "@/lib/reports/report-queries";

export const runtime = "nodejs";

async function sessionFromRequest(): Promise<{ role: ReturnType<typeof resolveEffectiveRole>; session: SessionPayload | null }> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;
  let session: SessionPayload | null = null;
  if (sessionToken) {
    try {
      session = JSON.parse(
        Buffer.from(sessionToken, "base64url").toString("utf8"),
      ) as SessionPayload;
    } catch {
      session = null;
    }
  }
  const role = resolveEffectiveRole({
    sessionRole: session?.role ?? null,
    cookieRole: cookieStore.get(ROLE_COOKIE)?.value,
  });
  return { role, session };
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;

  if (!(await dbAvailable())) {
    return NextResponse.json({ error: "db unavailable" }, { status: 503 });
  }

  const { id } = await params;
  const { role, session } = await sessionFromRequest();
  const orgScope = getOrgScope(role, session);
  const report = await getReportDetail({ id, scopeWhere: orgScopeWhere(orgScope) });

  if (!report) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({ db: true, report });
}
