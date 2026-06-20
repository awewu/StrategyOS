import { NextResponse, type NextRequest } from "next/server";
import { logUsageEvent } from "@/lib/audit/log-event";
import { dbAvailable, prisma } from "@/lib/db";
import { autoPersistDiffsForSnapshot, persistDiffsBetweenSnapshots } from "@/lib/stratos/persist-diff";
import type { SnapshotStatePayload } from "@/lib/types/stratos";
import * as demo from "@/lib/stratos-demo-data";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    fromCode?: string;
    toCode?: string;
    auto?: boolean;
    toSnapshotId?: string;
  };

  if (body.auto && body.toSnapshotId) {
    const result = await autoPersistDiffsForSnapshot(body.toSnapshotId, body.toCode ?? "");
    await logUsageEvent({
      action: "diff_persist",
      resource: body.toCode ?? body.toSnapshotId,
      metadata: result,
      request,
    });
    return NextResponse.json({ ok: true, ...result });
  }

  const fromCode = body.fromCode ?? "2025-FY-STRATEGIC";
  const toCode = body.toCode ?? "2026-FY-STRATEGIC";

  if (await dbAvailable()) {
    const [fromRow, toRow] = await Promise.all([
      prisma.strategicSnapshot.findUnique({ where: { code: fromCode } }),
      prisma.strategicSnapshot.findUnique({ where: { code: toCode } }),
    ]);
    if (fromRow && toRow) {
      const result = await persistDiffsBetweenSnapshots(
        fromRow.id,
        toRow.id,
        fromRow.stateJson as SnapshotStatePayload,
        toRow.stateJson as SnapshotStatePayload
      );
      await logUsageEvent({
        action: "diff_persist",
        resource: `${fromCode}→${toCode}`,
        metadata: { count: result.count },
        request,
      });
      return NextResponse.json({ ok: true, count: result.count, source: "database" });
    }
  }

  const result = await persistDiffsBetweenSnapshots(
    "mem-from",
    "mem-to",
    demo.snapshotFY25,
    demo.snapshotFY26
  );
  await logUsageEvent({
    action: "diff_persist",
    resource: `${fromCode}→${toCode}`,
    metadata: { count: result.count, source: "demo" },
    request,
  });
  return NextResponse.json({ ok: true, count: result.count, source: "demo" });
}
