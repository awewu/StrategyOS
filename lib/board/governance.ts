import { dbAvailable, prisma } from "@/lib/db";

/**
 * 董事会治理层：决议签署（审计哈希链上的不可篡改事件）、
 * 上会材料锁定（期次级 SystemSetting）、会议纪要归档。
 */

export type BoardSignature = { signedBy: string; signedAt: string };

export type BoardPackLock = { lockedBy: string; lockedAt: string } | null;

export type BoardMinute = {
  id: string;
  title: string;
  period: string;
  uploadedAt: string;
  approvalStatus: string;
};

export function lockKeyFor(period: string): string {
  return `board_pack_lock_${period}`;
}

export function signResourceFor(recordId: string): string {
  return `board:resolution:${recordId}`;
}

export async function getBoardPackLock(period: string): Promise<BoardPackLock> {
  if (!(await dbAvailable())) return null;
  const row = await prisma.systemSetting.findUnique({ where: { key: lockKeyFor(period) } });
  if (!row) return null;
  const [lockedBy, lockedAt] = row.value.split("|");
  return { lockedBy: lockedBy ?? "unknown", lockedAt: lockedAt ?? row.updatedAt.toISOString() };
}

export async function setBoardPackLock(period: string, lockedBy: string): Promise<void> {
  const value = `${lockedBy}|${new Date().toISOString()}`.slice(0, 200);
  await prisma.systemSetting.upsert({
    where: { key: lockKeyFor(period) },
    create: { key: lockKeyFor(period), value },
    update: { value },
  });
}

/** 决议 → 签署人列表（来自审计哈希链，天然不可篡改） */
export async function getResolutionSignatures(
  recordIds: string[],
): Promise<Map<string, BoardSignature[]>> {
  const map = new Map<string, BoardSignature[]>();
  if (recordIds.length === 0 || !(await dbAvailable())) return map;
  const rows = await prisma.usageLog.findMany({
    where: {
      action: "board_resolution_sign",
      resource: { in: recordIds.map(signResourceFor) },
    },
    orderBy: { createdAt: "asc" },
  });
  for (const r of rows) {
    const recordId = r.resource.replace("board:resolution:", "");
    const list = map.get(recordId) ?? [];
    // 同一人重复签只计首次
    if (!list.some((s) => s.signedBy === r.userEmail)) {
      list.push({ signedBy: r.userEmail, signedAt: r.createdAt.toISOString().slice(0, 10) });
    }
    map.set(recordId, list);
  }
  return map;
}

/** 会议纪要归档（已有 MEETING_MINUTES 报告类型） */
export async function getBoardMinutes(limit = 8): Promise<BoardMinute[]> {
  if (!(await dbAvailable())) return [];
  const rows = await prisma.report.findMany({
    where: { reportType: "MEETING_MINUTES" },
    orderBy: { uploadedAt: "desc" },
    take: limit,
  });
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    period: r.period,
    uploadedAt: r.uploadedAt.toISOString().slice(0, 10),
    approvalStatus: r.approvalStatus,
  }));
}
