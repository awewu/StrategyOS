import { dbAvailable, prisma } from "@/lib/db";
import { getActivePeriod } from "@/lib/data/active-period";

/** 导入期次闩：当前战略期 vs 总账最新已导入期，判断"该导数了" */

export type ImportFreshness = {
  available: boolean;
  activePeriod: string;
  latestLedgerPeriod: string | null;
  lastImportAt: string | null;
  /** true = 总账落后于当前期（或从未导入），该导数了 */
  stale: boolean;
};

export async function getImportFreshness(): Promise<ImportFreshness> {
  const activePeriod = await getActivePeriod();
  if (!(await dbAvailable())) {
    return { available: false, activePeriod, latestLedgerPeriod: null, lastImportAt: null, stale: false };
  }
  const [tbLatest, batchLatest] = await Promise.all([
    prisma.ledgerTbLine.findFirst({
      select: { period: true },
      orderBy: { period: "desc" },
    }),
    prisma.finImportBatch.findFirst({
      select: { createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const latestLedgerPeriod = tbLatest?.period ?? null;
  // YYYY-MM 字符串可直接字典序比较
  const stale = latestLedgerPeriod == null || latestLedgerPeriod < activePeriod;
  return {
    available: true,
    activePeriod,
    latestLedgerPeriod,
    lastImportAt: batchLatest?.createdAt.toISOString().slice(0, 10) ?? null,
    stale,
  };
}
