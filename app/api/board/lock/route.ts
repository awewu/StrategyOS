import { NextResponse } from "next/server";
import { requireApiMinLevel } from "@/lib/auth/api-guard";
import { getEffectiveSession } from "@/lib/auth/guard";
import { logUsageEvent } from "@/lib/audit/log-event";
import { dbAvailable } from "@/lib/db";
import { getActivePeriod } from "@/lib/data/active-period";
import { getBoardPackLock, setBoardPackLock } from "@/lib/board/governance";

export const runtime = "nodejs";

/** 上会材料锁定：CEO/CFO（L3+）冻结本期董事会包口径，锁后不可覆盖 */
export async function POST(req: Request) {
  const denied = await requireApiMinLevel(3);
  if (denied) return denied;
  if (!(await dbAvailable())) {
    return NextResponse.json({ error: "database unavailable" }, { status: 503 });
  }
  const period = await getActivePeriod();
  const existing = await getBoardPackLock(period);
  if (existing) {
    return NextResponse.json(
      { error: `本期材料已由 ${existing.lockedBy} 于 ${existing.lockedAt.slice(0, 10)} 锁定` },
      { status: 409 },
    );
  }
  const session = await getEffectiveSession();
  const by = session?.email ?? session?.name ?? "ceo";
  await setBoardPackLock(period, by);
  await logUsageEvent({
    action: "board_pack_lock",
    resource: `board:pack:${period}`,
    metadata: { period },
    request: req,
  });
  return NextResponse.json({ ok: true, period, lockedBy: by });
}
