import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requireApiMinLevel } from "@/lib/auth/api-guard";
import type { SessionPayload } from "@/lib/auth/config";
import { ROLE_COOKIE, SESSION_COOKIE } from "@/lib/auth/config";
import { getOrgScope, orgScopeWhere } from "@/lib/auth/scope";
import { resolveEffectiveRole } from "@/lib/auth/resolve-role";
import { dbAvailable, prisma } from "@/lib/db";

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

export async function GET(req: Request) {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const orgUnitId = searchParams.get("orgUnitId") ?? undefined;
  const reportType = searchParams.get("reportType") ?? undefined;
  const period = searchParams.get("period") ?? undefined;
  const approval = searchParams.get("approval") ?? undefined;

  if (!(await dbAvailable())) {
    return NextResponse.json({ rows: [], db: false });
  }

  const { role, session } = await sessionFromRequest();
  const orgScope = getOrgScope(role, session);
  const scopeWhere = orgScopeWhere(orgScope);

  if (orgUnitId && orgScope != null && !orgScope.includes(orgUnitId)) {
    return NextResponse.json({ rows: [], db: true, scoped: true });
  }

  const rows = await prisma.report.findMany({
    where: {
      ...scopeWhere,
      ...(orgUnitId ? { orgUnitId } : {}),
      ...(reportType ? { reportType: reportType as never } : {}),
      ...(period ? { period: { startsWith: period } } : {}),
      ...(approval ? { approvalStatus: approval as never } : {}),
    },
    include: { orgUnit: { select: { id: true, name: true, level: true } } },
    orderBy: { uploadedAt: "desc" },
    take: 100,
  });

  return NextResponse.json({
    db: true,
    rows: rows.map((r) => ({
      id: r.id,
      title: r.title,
      reportType: r.reportType,
      period: r.period,
      approvalStatus: r.approvalStatus,
      uploadedAt: r.uploadedAt.toISOString(),
      orgUnit: r.orgUnit ?? null,
      fileOrigName: r.fileOrigName ?? null,
      fileSizeBytes: r.fileSizeBytes ?? null,
      hasParsed: !!r.parsedJson,
    })),
  });
}
