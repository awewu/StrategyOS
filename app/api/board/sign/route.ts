import { NextResponse } from "next/server";
import { requireApiMinLevel } from "@/lib/auth/api-guard";
import { getEffectiveRole } from "@/lib/auth/guard";
import { isAdmin } from "@/lib/auth/permissions";
import { logUsageEvent } from "@/lib/audit/log-event";
import { dbAvailable, prisma } from "@/lib/db";
import { signResourceFor } from "@/lib/board/governance";

export const runtime = "nodejs";

/** 董事决议签署：写入审计哈希链（不可篡改），仅 board 角色与 admin 可签 */
export async function POST(req: Request) {
  const denied = await requireApiMinLevel(0);
  if (denied) return denied;
  const role = await getEffectiveRole();
  if (role !== "board" && !isAdmin(role)) {
    return NextResponse.json({ error: "仅董事角色可签署决议" }, { status: 403 });
  }
  if (!(await dbAvailable())) {
    return NextResponse.json({ error: "database unavailable" }, { status: 503 });
  }
  const b = (await req.json()) as { recordId?: string };
  if (!b.recordId) return NextResponse.json({ error: "recordId required" }, { status: 400 });

  const rec = await prisma.inboxRecord.findUnique({ where: { id: b.recordId } });
  if (!rec) return NextResponse.json({ error: "决议不存在" }, { status: 404 });
  if (rec.status !== "CLOSED" && rec.status !== "ASSIGNED") {
    return NextResponse.json({ error: "仅已议决/已指派的议题可签署" }, { status: 400 });
  }

  const log = await logUsageEvent({
    action: "board_resolution_sign",
    resource: signResourceFor(rec.id),
    metadata: { title: rec.title, resolution: rec.resolution, status: rec.status },
    request: req,
  });
  return NextResponse.json({ ok: true, signedBy: log.userEmail, hash: log.hash ?? null });
}
