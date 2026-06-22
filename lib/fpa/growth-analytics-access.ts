import { asDbJson, dbAvailable, prisma, safeDbQuery } from "@/lib/db";
import * as demo from "@/lib/stratos-demo-data";
import type { AarrrFunnelStage, KellerBrandLayer } from "@/lib/types/stratos";

export type GrowthAnalyticsBundle = {
  aarrrFunnel: AarrrFunnelStage[];
  kellerBrandLayers: KellerBrandLayer[];
  source: "database" | "demo";
};

function defaultGrowthAnalytics(): Omit<GrowthAnalyticsBundle, "source"> {
  return {
    aarrrFunnel: demo.aarrrFunnel,
    kellerBrandLayers: demo.kellerBrandLayers,
  };
}

export function parseGrowthAnalyticsJson(
  aarrrFunnelJson: unknown,
  kellerBrandJson: unknown,
): Omit<GrowthAnalyticsBundle, "source"> {
  const aarrrFunnel = aarrrFunnelJson as AarrrFunnelStage[];
  const kellerBrandLayers = kellerBrandJson as KellerBrandLayer[];
  if (!Array.isArray(aarrrFunnel) || !Array.isArray(kellerBrandLayers)) {
    throw new Error("增长分析数据格式无效");
  }
  return { aarrrFunnel, kellerBrandLayers };
}

async function seedGrowthIfEmpty(period: string): Promise<void> {
  const existing = await prisma.strategicGrowthAnalytics.findUnique({ where: { period } });
  if (existing) return;
  const d = defaultGrowthAnalytics();
  await prisma.strategicGrowthAnalytics.create({
    data: {
      period,
      aarrrFunnelJson: asDbJson(d.aarrrFunnel),
      kellerBrandJson: asDbJson(d.kellerBrandLayers),
    },
  });
}

export async function getGrowthAnalytics(
  period = demo.CURRENT_PERIOD,
): Promise<GrowthAnalyticsBundle> {
  const fallback = { ...defaultGrowthAnalytics(), source: "demo" as const };
  if (!(await dbAvailable())) return fallback;
  return safeDbQuery(async () => {
    await seedGrowthIfEmpty(period);
    const row = await prisma.strategicGrowthAnalytics.findUnique({ where: { period } });
    if (!row) return fallback;
    const parsed = parseGrowthAnalyticsJson(row.aarrrFunnelJson, row.kellerBrandJson);
    return { ...parsed, source: "database" as const };
  }, fallback);
}

export async function saveGrowthAnalytics(
  payload: Omit<GrowthAnalyticsBundle, "source">,
  period = demo.CURRENT_PERIOD,
): Promise<GrowthAnalyticsBundle> {
  if (!(await dbAvailable())) throw new Error("DATABASE_URL unset — 无法保存增长分析");
  await seedGrowthIfEmpty(period);
  const row = await prisma.strategicGrowthAnalytics.findUnique({ where: { period } });
  if (!row) throw new Error("增长分析记录未找到");

  for (const s of payload.aarrrFunnel) {
    if (!s.stage || !s.label?.trim()) throw new Error("AARRR 阶段与标签不能为空");
  }
  for (const l of payload.kellerBrandLayers) {
    if (!l.name?.trim()) throw new Error("Keller 层级名称不能为空");
  }

  await prisma.strategicGrowthAnalytics.update({
    where: { id: row.id },
    data: {
      aarrrFunnelJson: asDbJson(payload.aarrrFunnel),
      kellerBrandJson: asDbJson(payload.kellerBrandLayers),
    },
  });
  return { ...payload, source: "database" };
}
