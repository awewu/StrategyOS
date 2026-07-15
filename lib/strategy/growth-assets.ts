/**
 * 增长资产读写：品牌策略卡 / 产品路线图 / JTBD 卡 / 产品线。
 * 补齐这四类实体的落库写路径（此前只读，DB 空则永远回退 demo）。
 */
import { prisma } from "@/lib/db";
import { getActivePeriod } from "@/lib/data/active-period";

export const GROWTH_BRAND_CODES = ["RUIMEI", "HENGRE", "RUUD", "TECH_HOME"] as const;
export const ROADMAP_LANES = ["now", "next", "later"] as const;
export const ROADMAP_STATUSES = ["planned", "in_progress", "shipped", "deferred"] as const;

export interface ProductLineOption {
  id: string;
  code: string;
  name: string;
  brandCode: string;
}

export interface RoadmapRowInput {
  productLineId: string;
  lane: (typeof ROADMAP_LANES)[number];
  milestone: string;
  targetQuarter: string;
  status: (typeof ROADMAP_STATUSES)[number];
}

export interface JtbdRowInput {
  productLineId: string;
  statement: string;
  primarySegment: string;
}

export interface BrandCardRowInput {
  brandCode: (typeof GROWTH_BRAND_CODES)[number];
  winningAspiration: string;
  whereToPlay: string;
  howToWin: string;
}

export async function getGrowthAssetsBundle() {
  const period = await getActivePeriod();
  const [productLines, roadmap, jtbd, brandCards] = await Promise.all([
    prisma.productLine.findMany({ orderBy: { code: "asc" } }),
    prisma.productRoadmapItem.findMany({ orderBy: { targetQuarter: "asc" } }),
    prisma.jtbdCard.findMany(),
    prisma.brandStrategyCard.findMany({ where: { period, workingVersionId: null } }),
  ]);
  return {
    period,
    productLines: productLines.map((l): ProductLineOption => ({
      id: l.id,
      code: l.code,
      name: l.name,
      brandCode: l.brandCode,
    })),
    roadmap: roadmap.map((r) => ({
      id: r.id,
      productLineId: r.productLineId,
      lane: r.lane as RoadmapRowInput["lane"],
      milestone: r.milestone,
      targetQuarter: r.targetQuarter,
      status: r.status as RoadmapRowInput["status"],
    })),
    jtbd: jtbd.map((j) => ({
      id: j.id,
      productLineId: j.productLineId,
      statement: j.statement,
      primarySegment: j.primarySegment,
    })),
    brandCards: brandCards.map((b) => {
      const wtp = b.whereToPlayJson as { summary?: string } | string;
      return {
        id: b.id,
        brandCode: b.brandCode as BrandCardRowInput["brandCode"],
        winningAspiration: b.winningAspiration,
        whereToPlay: typeof wtp === "string" ? wtp : (wtp?.summary ?? ""),
        howToWin: b.howToWin,
      };
    }),
  };
}

export type GrowthAssetsBundle = Awaited<ReturnType<typeof getGrowthAssetsBundle>>;

export async function createProductLine(input: { code: string; name: string; brandCode: string }) {
  if (!input.code?.trim() || !input.name?.trim()) throw new Error("产品线 code 与名称必填");
  if (!GROWTH_BRAND_CODES.includes(input.brandCode as never)) throw new Error("brandCode 非法");
  return prisma.productLine.create({
    data: {
      code: input.code.trim(),
      name: input.name.trim(),
      brandCode: input.brandCode as never,
    },
  });
}

/** 路线图整表替换（全局，不分期） */
export async function saveRoadmap(rows: RoadmapRowInput[]) {
  for (const r of rows) {
    if (!r.productLineId || !r.milestone?.trim() || !r.targetQuarter?.trim()) {
      throw new Error("路线图行需要 产品线/里程碑/目标季度");
    }
    if (!ROADMAP_LANES.includes(r.lane)) throw new Error("lane 非法");
    if (!ROADMAP_STATUSES.includes(r.status)) throw new Error("status 非法");
  }
  await prisma.$transaction([
    prisma.productRoadmapItem.deleteMany({}),
    prisma.productRoadmapItem.createMany({
      data: rows.map((r) => ({
        productLineId: r.productLineId,
        lane: r.lane as never,
        milestone: r.milestone.trim().slice(0, 200),
        targetQuarter: r.targetQuarter.trim().slice(0, 7),
        status: r.status as never,
        linkedAssumptionIds: [],
      })),
    }),
  ]);
}

/** JTBD 卡整表替换 */
export async function saveJtbd(rows: JtbdRowInput[]) {
  for (const r of rows) {
    if (!r.productLineId || !r.statement?.trim() || !r.primarySegment?.trim()) {
      throw new Error("JTBD 行需要 产品线/任务陈述/主客群");
    }
  }
  await prisma.$transaction([
    prisma.jtbdCard.deleteMany({}),
    prisma.jtbdCard.createMany({
      data: rows.map((r) => ({
        productLineId: r.productLineId,
        statement: r.statement.trim().slice(0, 200),
        primarySegment: r.primarySegment.trim().slice(0, 50),
        outcomeMetrics: [],
        linkedOkrIds: [],
      })),
    }),
  ]);
}

/** 品牌策略卡整表替换（活跃期 · 工作区版本） */
export async function saveBrandCards(rows: BrandCardRowInput[]) {
  const period = await getActivePeriod();
  const seen = new Set<string>();
  for (const r of rows) {
    if (!GROWTH_BRAND_CODES.includes(r.brandCode)) throw new Error("brandCode 非法");
    if (seen.has(r.brandCode)) throw new Error(`品牌 ${r.brandCode} 重复`);
    seen.add(r.brandCode);
    if (!r.winningAspiration?.trim() || !r.howToWin?.trim()) {
      throw new Error("品牌卡需要 制胜愿景/如何取胜");
    }
  }
  await prisma.$transaction([
    prisma.brandStrategyCard.deleteMany({ where: { period, workingVersionId: null } }),
    prisma.brandStrategyCard.createMany({
      data: rows.map((r) => ({
        period,
        brandCode: r.brandCode as never,
        winningAspiration: r.winningAspiration.trim().slice(0, 60),
        whereToPlayJson: { summary: r.whereToPlay?.trim() ?? "" },
        howToWin: r.howToWin.trim().slice(0, 200),
        mustHaveCapabilities: [],
        linkedBscDimensionIds: [],
        linkedObjectiveIds: [],
      })),
    }),
  ]);
}
