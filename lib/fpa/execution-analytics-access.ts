import type { HorizonBubble } from "@/components/execution/HorizonBubbleChart";
import { asDbJson, dbAvailable, prisma, safeDbQuery } from "@/lib/db";
import * as demo from "@/lib/stratos-demo-data";
import type { RiceItem, TrlRadarPoint } from "@/lib/types/stratos";

export type ExecutionAnalyticsBundle = {
  horizonBubbles: HorizonBubble[];
  riceItems: RiceItem[];
  trlRadar: TrlRadarPoint[];
  source: "database" | "demo";
};

function defaultExecutionAnalytics(): Omit<ExecutionAnalyticsBundle, "source"> {
  return {
    horizonBubbles: demo.horizonBubbles,
    riceItems: demo.riceItems,
    trlRadar: demo.trlRadar,
  };
}

export function parseExecutionAnalyticsJson(
  horizonBubblesJson: unknown,
  riceItemsJson: unknown,
  trlRadarJson: unknown,
): Omit<ExecutionAnalyticsBundle, "source"> {
  const horizonBubbles = horizonBubblesJson as HorizonBubble[];
  const riceItems = riceItemsJson as RiceItem[];
  const trlRadar = trlRadarJson as TrlRadarPoint[];
  if (!Array.isArray(horizonBubbles) || !Array.isArray(riceItems) || !Array.isArray(trlRadar)) {
    throw new Error("执行分析数据格式无效");
  }
  return { horizonBubbles, riceItems, trlRadar };
}

async function seedExecutionAnalyticsIfEmpty(period: string): Promise<void> {
  const existing = await prisma.strategicExecutionAnalytics.findUnique({ where: { period } });
  if (existing) return;
  const d = defaultExecutionAnalytics();
  await prisma.strategicExecutionAnalytics.create({
    data: {
      period,
      horizonBubblesJson: asDbJson(d.horizonBubbles),
      riceItemsJson: asDbJson(d.riceItems),
      trlRadarJson: asDbJson(d.trlRadar),
    },
  });
}

export async function getExecutionAnalytics(
  period = demo.CURRENT_PERIOD,
): Promise<ExecutionAnalyticsBundle> {
  const fallback = { ...defaultExecutionAnalytics(), source: "demo" as const };
  if (!(await dbAvailable())) return fallback;
  return safeDbQuery(async () => {
    await seedExecutionAnalyticsIfEmpty(period);
    const row = await prisma.strategicExecutionAnalytics.findUnique({ where: { period } });
    if (!row) return fallback;
    const parsed = parseExecutionAnalyticsJson(
      row.horizonBubblesJson,
      row.riceItemsJson,
      row.trlRadarJson,
    );
    return { ...parsed, source: "database" as const };
  }, fallback);
}

export async function saveExecutionAnalytics(
  payload: Omit<ExecutionAnalyticsBundle, "source">,
  period = demo.CURRENT_PERIOD,
): Promise<ExecutionAnalyticsBundle> {
  if (!(await dbAvailable())) throw new Error("DATABASE_URL unset — 无法保存执行分析");
  await seedExecutionAnalyticsIfEmpty(period);
  const row = await prisma.strategicExecutionAnalytics.findUnique({ where: { period } });
  if (!row) throw new Error("执行分析记录未找到");

  for (const b of payload.horizonBubbles) {
    if (!b.code?.trim() || !b.name?.trim()) throw new Error("Horizon 项目编号与名称不能为空");
  }
  for (const r of payload.riceItems) {
    if (!r.id?.trim() || !r.initiative?.trim()) throw new Error("RICE 项 ID 与名称不能为空");
  }
  for (const t of payload.trlRadar) {
    if (!t.domain?.trim()) throw new Error("TRL 域名称不能为空");
  }

  await prisma.strategicExecutionAnalytics.update({
    where: { id: row.id },
    data: {
      horizonBubblesJson: asDbJson(payload.horizonBubbles),
      riceItemsJson: asDbJson(payload.riceItems),
      trlRadarJson: asDbJson(payload.trlRadar),
    },
  });
  return { ...payload, source: "database" };
}
