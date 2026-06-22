import { NextResponse, type NextRequest } from "next/server";
import { requireApiAdmin } from "@/lib/auth/api-guard";
import { getMemoryChain, logUsageEvent } from "@/lib/audit/log-event";
import { verifyChainSlice } from "@/lib/audit/verify-chain";
import { serializeAuditCsv } from "@/lib/audit/export";
import type { UsageLogRecord } from "@/lib/audit/types";
import { dbAvailable, prisma } from "@/lib/db";

const MAX_EXPORT = 5000;

async function loadChain(): Promise<{ rows: UsageLogRecord[]; source: "database" | "memory" }> {
  if (!(await dbAvailable())) {
    return { rows: getMemoryChain(), source: "memory" };
  }
  try {
    const rows = await prisma.usageLog.findMany({
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: MAX_EXPORT,
    });
    return {
      source: "database",
      rows: rows.map((r) => ({
        id: r.id,
        userId: r.userId ?? undefined,
        userEmail: r.userEmail,
        action: r.action,
        resource: r.resource,
        metadata: (r.metadata as Record<string, unknown> | null) ?? undefined,
        ip: r.ip ?? undefined,
        userAgent: r.userAgent ?? undefined,
        prevHash: r.prevHash ?? undefined,
        hash: r.hash ?? undefined,
        createdAt: r.createdAt,
      })),
    };
  } catch {
    return { rows: getMemoryChain(), source: "memory" };
  }
}

export async function GET(request: NextRequest) {
  const denied = await requireApiAdmin();
  if (denied) return denied;

  const format = new URL(request.url).searchParams.get("format") === "csv" ? "csv" : "json";
  const { rows, source } = await loadChain();
  const integrity = verifyChainSlice(rows, source);

  await logUsageEvent({
    action: "audit_export",
    resource: `format=${format}`,
    metadata: { count: rows.length, source, integrityOk: integrity.ok },
    request,
  });

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");

  if (format === "csv") {
    return new NextResponse(serializeAuditCsv(rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="stratos-audit-${stamp}.csv"`,
        "X-Audit-Integrity": integrity.ok ? "verified" : "broken",
      },
    });
  }

  return NextResponse.json(
    { exportedAt: new Date().toISOString(), source, integrity, count: rows.length, logs: rows },
    {
      headers: {
        "Content-Disposition": `attachment; filename="stratos-audit-${stamp}.json"`,
        "X-Audit-Integrity": integrity.ok ? "verified" : "broken",
      },
    },
  );
}
