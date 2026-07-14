/**
 * Demo 水位标记 — 检测「DB 可用但单表为空 → entity-getters 静默回退 demo」的盲区。
 *
 * 全局 DataSourceBanner 原来只能区分「DB 整体不可用」；本模块逐实体探测
 * 活跃周期内的行数，行数为 0 的实体正在向用户展示演示数据，必须显性标出。
 * 探测清单与 lib/data/entity-getters.ts 的回退条件一一对应。
 */
import { prisma } from "@/lib/db";
import { getActivePeriod } from "@/lib/data/active-period";

export interface DemoWatermarkProbe {
  key: string;
  label: string;
}

/** 与 entity-getters 回退点对应的探测项（key 稳定,供测试与前端使用） */
export const DEMO_WATERMARK_PROBES: DemoWatermarkProbe[] = [
  { key: "brandCards", label: "品牌策略卡" },
  { key: "productBets", label: "产品赌注" },
  { key: "gtmBets", label: "GTM 赌注" },
  { key: "projects", label: "项目 Vx" },
  { key: "assumptions", label: "假设 Hx" },
  { key: "objectives", label: "OKR 目标" },
  { key: "keyResults", label: "关键结果" },
  { key: "capacity", label: "产能快照" },
  { key: "healthLights", label: "健康四灯" },
  { key: "healthKpis", label: "核心 KPI" },
  { key: "productRoadmap", label: "产品路线图" },
  { key: "jtbdCards", label: "JTBD 卡" },
];

/** 纯函数:行数为 0 的实体即处于 demo 回退态 */
export function deriveDemoFallbacks(
  counts: Record<string, number>,
  probes: DemoWatermarkProbe[] = DEMO_WATERMARK_PROBES,
): string[] {
  return probes.filter((p) => (counts[p.key] ?? 0) === 0).map((p) => p.label);
}

/** 纯函数:回退实体数 → 水位信号 */
export function watermarkSignal(fallbackCount: number): "green" | "yellow" | "red" {
  if (fallbackCount === 0) return "green";
  return fallbackCount >= 4 ? "red" : "yellow";
}

/** DB 探测:返回当前正在回退 demo 的实体显示名列表（DB 不可用时由调用方兜底） */
export async function getDemoFallbackEntities(): Promise<string[]> {
  const period = await getActivePeriod();
  const [
    brandCards,
    productBets,
    gtmBets,
    projects,
    assumptions,
    objectives,
    keyResults,
    capacity,
    healthLights,
    healthKpis,
    productRoadmap,
    jtbdCards,
  ] = await Promise.all([
    prisma.brandStrategyCard.count({ where: { period } }),
    prisma.productBet.count({ where: { period } }),
    prisma.gtmBet.count({ where: { period } }),
    prisma.project.count({ where: { period } }),
    prisma.assumption.count({ where: { period } }),
    prisma.objective.count({ where: { period } }),
    prisma.keyResult.count({ where: { period } }),
    prisma.capacitySnapshot.count({ where: { period } }),
    prisma.healthSignal.count({ where: { period } }),
    prisma.healthSignal.count({ where: { period, kpiName: { not: null } } }),
    prisma.productRoadmapItem.count(),
    prisma.jtbdCard.count(),
  ]);
  return deriveDemoFallbacks({
    brandCards,
    productBets,
    gtmBets,
    projects,
    assumptions,
    objectives,
    keyResults,
    capacity,
    healthLights,
    healthKpis,
    productRoadmap,
    jtbdCards,
  });
}
