/**
 * Persist StratDiff records to diff_records when snapshots exist in DB.
 */
import { dbAvailable, prisma } from "@/lib/db";
import { computeStratDiff } from "@/lib/stratos/strat-diff";
import type { DiffRecord, SnapshotStatePayload } from "@/lib/types/stratos";
import type { DiffCategory, DiffSeverity } from "@prisma/client";

const memoryDiffs: DiffRecord[] = [];

export async function persistDiffsBetweenSnapshots(
  fromSnapshotId: string,
  toSnapshotId: string,
  fromState: SnapshotStatePayload,
  toState: SnapshotStatePayload,
  reportPatterns: Parameters<typeof computeStratDiff>[2] = []
): Promise<{ count: number; diffs: DiffRecord[] }> {
  const diffs = computeStratDiff(fromState, toState, reportPatterns);

  if (await dbAvailable()) {
    const [fromRow, toRow] = await Promise.all([
      prisma.strategicSnapshot.findUnique({ where: { id: fromSnapshotId }, select: { id: true } }),
      prisma.strategicSnapshot.findUnique({ where: { id: toSnapshotId }, select: { id: true } }),
    ]);
    if (fromRow && toRow) {
      await prisma.diffRecord.deleteMany({
        where: { fromSnapshotId, toSnapshotId },
      });
      if (diffs.length > 0) {
        await prisma.diffRecord.createMany({
          data: diffs.map((d) => ({
            fromSnapshotId,
            toSnapshotId,
            category: d.category as DiffCategory,
            severity: mapSeverity(d.severity),
            title: d.title.slice(0, 200),
            detail: d.detail,
            formationType: d.formationType ?? undefined,
            beforeJson: d.beforeJson ?? undefined,
            afterJson: d.afterJson ?? undefined,
          })),
        });
      }
    }
  } else {
    memoryDiffs.push(...diffs);
    if (memoryDiffs.length > 500) memoryDiffs.splice(0, memoryDiffs.length - 500);
  }

  return { count: diffs.length, diffs };
}

export async function autoPersistDiffsForSnapshot(toSnapshotId: string, toCode: string) {
  if (!(await dbAvailable())) return { count: 0, fromCode: null as string | null };

  const toRow = await prisma.strategicSnapshot.findUnique({
    where: { id: toSnapshotId },
  });
  if (!toRow) return { count: 0, fromCode: null };

  const fromRow = await prisma.strategicSnapshot.findFirst({
    where: {
      frozenAt: { lt: toRow.frozenAt },
      code: { not: toCode },
    },
    orderBy: { frozenAt: "desc" },
  });
  if (!fromRow) return { count: 0, fromCode: null };

  const fromState = fromRow.stateJson as SnapshotStatePayload;
  const toState = toRow.stateJson as SnapshotStatePayload;
  const result = await persistDiffsBetweenSnapshots(
    fromRow.id,
    toSnapshotId,
    fromState,
    toState
  );
  return { count: result.count, fromCode: fromRow.code };
}

export function getMemoryDiffRecords(): DiffRecord[] {
  return [...memoryDiffs];
}

function mapSeverity(s: DiffRecord["severity"]): DiffSeverity {
  if (s === "critical" || s === "high") return "critical";
  if (s === "warning" || s === "medium") return "warning";
  return "info";
}
