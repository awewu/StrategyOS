import { dbAvailable, prisma } from "@/lib/db";
import { feedbackLoops as demoLoops } from "@/lib/stratos-demo-data";
import type { FeedbackLoop, FeedbackLoopKind } from "@/lib/types/stratos";
import { getActivePeriod } from "@/lib/data/active-period";

const KINDS: FeedbackLoopKind[] = ["R", "B", "D"];

function mapLoop(r: {
  id: string;
  kind: string;
  label: string;
  chain: string;
  bscDimension: string;
  fpaLinked: boolean;
}): FeedbackLoop {
  return {
    id: r.id,
    kind: r.kind as FeedbackLoopKind,
    label: r.label,
    chain: r.chain,
    bscDimension: r.bscDimension,
    fpaLinked: r.fpaLinked,
  };
}

async function seedFeedbackIfEmpty(period: string): Promise<void> {
  const n = await prisma.feedbackLoopRecord.count({ where: { period } });
  if (n > 0) return;
  await prisma.feedbackLoopRecord.createMany({
    data: demoLoops.map((l, i) => ({
      period,
      kind: l.kind,
      label: l.label,
      chain: l.chain,
      bscDimension: l.bscDimension,
      fpaLinked: l.fpaLinked ?? false,
      sortOrder: i,
    })),
  });
}

export async function getFeedbackLoops(period?: string): Promise<{
  loops: FeedbackLoop[];
  source: "database" | "demo";
}> {
  const activePeriod = period ?? await getActivePeriod();
  if (!(await dbAvailable())) {
    return { loops: demoLoops, source: "demo" };
  }
  try {
    await seedFeedbackIfEmpty(activePeriod);
    const rows = await prisma.feedbackLoopRecord.findMany({
      where: { period: activePeriod },
      orderBy: { sortOrder: "asc" },
    });
    if (rows.length === 0) return { loops: demoLoops, source: "demo" };
    return { loops: rows.map(mapLoop), source: "database" };
  } catch {
    return { loops: demoLoops, source: "demo" };
  }
}

export async function saveFeedbackLoops(
  loops: FeedbackLoop[],
  period?: string,
): Promise<{ count: number }> {
  const activePeriod = period ?? await getActivePeriod();
  if (!(await dbAvailable())) throw new Error("DATABASE_URL unset — 无法保存反馈环");
  for (const l of loops) {
    if (!KINDS.includes(l.kind)) {
      throw new Error(`反馈环类型须为 R / B / D，收到 ${l.kind}`);
    }
    if (!l.label.trim() || !l.chain.trim()) {
      throw new Error("标签与因果链不能为空");
    }
  }
  await prisma.$transaction(async (tx) => {
    await tx.feedbackLoopRecord.deleteMany({ where: { period: activePeriod } });
    await tx.feedbackLoopRecord.createMany({
      data: loops.map((l, i) => ({
        period: activePeriod,
        kind: l.kind,
        label: l.label.trim(),
        chain: l.chain.trim(),
        bscDimension: l.bscDimension.trim(),
        fpaLinked: Boolean(l.fpaLinked),
        sortOrder: i,
      })),
    });
  });
  return { count: loops.length };
}
