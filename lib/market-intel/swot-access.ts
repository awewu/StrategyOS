import { dbAvailable, prisma } from "@/lib/db";
import { getActivePeriod } from "@/lib/data/active-period";
import { demoSelfScores } from "@/lib/market-intel/demo-data";
import type { IntelDimension } from "@/lib/market-intel/types";

const DIMENSIONS: IntelDimension[] = ["product", "gtm", "brand", "strategy"];

export async function getMarketSelfScores(period?: string): Promise<{
  scores: Partial<Record<IntelDimension, number>>;
  source: "database" | "demo";
}> {
  const activePeriod = period ?? (await getActivePeriod());
  if (!(await dbAvailable())) {
    return { scores: demoSelfScores, source: "demo" };
  }
  try {
    const row = await prisma.marketSelfScores.findUnique({
      where: { period: activePeriod },
    });
    if (!row) {
      return { scores: demoSelfScores, source: "demo" };
    }
    const stored = (row.scoresJson ?? {}) as Partial<Record<IntelDimension, number>>;
    return { scores: { ...demoSelfScores, ...stored }, source: "database" };
  } catch {
    return { scores: demoSelfScores, source: "demo" };
  }
}

export async function saveMarketSelfScores(
  scores: Partial<Record<IntelDimension, number>>,
  period?: string,
): Promise<{ scores: Partial<Record<IntelDimension, number>>; source: "database" }> {
  const activePeriod = period ?? (await getActivePeriod());
  if (!(await dbAvailable())) {
    throw new Error("DATABASE_URL unset — 无法保存自评分");
  }

  const cleaned: Partial<Record<IntelDimension, number>> = {};
  for (const dim of DIMENSIONS) {
    const v = scores[dim];
    if (typeof v === "number" && !Number.isNaN(v)) {
      cleaned[dim] = Math.max(0, Math.min(100, Math.round(v)));
    }
  }

  const row = await prisma.marketSelfScores.upsert({
    where: { period: activePeriod },
    create: { period: activePeriod, scoresJson: cleaned },
    update: { scoresJson: cleaned },
  });

  const stored = (row.scoresJson ?? {}) as Partial<Record<IntelDimension, number>>;
  return { scores: { ...demoSelfScores, ...stored }, source: "database" };
}
