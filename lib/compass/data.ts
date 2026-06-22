import { prisma } from "@/lib/db";
import {
  ensurePlanMilestones,
  ensurePlanPremises,
  getActiveStrategicPlan,
  hasPlanContent,
  planMilestonesToCompass,
  planObjectivesToBscRows,
  planPremisesToCompass,
} from "@/lib/data/strategic-plan-data";
import { scoreMilestones } from "./risk-engine";
import { ensureCompassChildren } from "./seed";
import { refreshCompassAudit, refreshPlanCompassAudit } from "./sync-audit";
import type { CompassBundle, CompassMilestone, NorthStar, PremiseAudit } from "./types";

const DEMO_NORTH_STAR: NorthStar = {
  id: "demo-ns",
  mission: "让每个中国家庭和建筑用上高效、可靠的热能系统，推动碳中和转型",
  vision: "2030年成为中国热泵与热水领域综合竞争力第一的民营品牌集团，营收突破25亿",
  targetYear: 2030,
  revenueTarget: 25000,
  profitMarginTarget: 0.12,
  marketPositionDesc: "热泵两联供市占率前三，酒店/精装工程渠道首选品牌",
  geographyDesc: "全国大区全覆盖，华东/华南深度渗透，海外布局东南亚试点",
  brandDesc: "RUUD主攻高端工程，HENGRE守住中端家用，RUIMEI覆盖经济型，科技住宅打入智能生态",
};

const DEMO_MILESTONES: CompassMilestone[] = [
  { id: "m1", year: 2026, label: "站稳1亿·热泵V4上市", revenueTarget: 10000, profitMarginTarget: 0.08, keyConditions: ["V4完成量产认证", "华东酒店渠道突破300家", "现金runway>3个月"], revenueActual: 5120, progressNote: "H1完成5120万，V4延至Q4", riskScore: null, riskFactors: [] },
  { id: "m2", year: 2027, label: "跨越1.8亿·渠道密度", revenueTarget: 18000, profitMarginTarget: 0.10, keyConditions: ["全国大区经理体系建立", "V4+V5产品线完整", "自研控制芯片TRL6+"], revenueActual: null, progressNote: null, riskScore: null, riskFactors: [] },
  { id: "m3", year: 2028, label: "冲击2.5亿·利润拐点", revenueTarget: 25000, profitMarginTarget: 0.11, keyConditions: ["EBITDA>11%", "至少一个品牌进入细分市场前三", "供应链本地化率>60%"], revenueActual: null, progressNote: null, riskScore: null, riskFactors: [] },
  { id: "m4", year: 2030, label: "终点25亿·品牌集团", revenueTarget: 25000, profitMarginTarget: 0.12, keyConditions: ["市占率第一第二", "海外收入占比>10%", "平台型产品能力"], revenueActual: null, progressNote: null, riskScore: null, riskFactors: [] },
];

const DEMO_PREMISES: PremiseAudit[] = [
  { id: "p1", code: "P1", premise: "热泵渗透率持续提升：碳中和政策支撑，2026-2030年热泵渗透率从8%提升至20%+", category: "market", confidence: 75, fragility: 60, lastValidatedAt: "2026-06-01", validationNote: "政策面积极，但执行节奏有不确定性", failSignal: null, signalSource: null, signalAt: null },
  { id: "p2", code: "P2", premise: "史密斯/开利不发动价格战主动防御：以品牌溢价和服务为核心护城河", category: "competition", confidence: 45, fragility: 85, lastValidatedAt: "2026-06-10", validationNote: "史密斯H1已降价8%，假设受挑战", failSignal: "史密斯H1价格下调8%，渠道激励从8%提升至12%", signalSource: "Hermes 渠道调研 2026-06-10", signalAt: "2026-06-10" },
  { id: "p3", code: "P3", premise: "V4热泵能在2026年完成产品化：控制算法冻结→量产认证→渠道铺货全链路", category: "technology", confidence: 55, fragility: 90, lastValidatedAt: "2026-06-01", validationNote: "控制算法未冻结，延迟Q4，直接影响2026里程碑", failSignal: "V4量产里程碑从Q2延至Q4，华东推进窗口期收窄", signalSource: "研发月报 2026-06", signalAt: "2026-06-05" },
  { id: "p4", code: "P4", premise: "酒店/精装工程渠道可在华东以外复制：华东工程经理模式可标准化推广", category: "capability", confidence: 65, fragility: 70, lastValidatedAt: "2026-05-15", validationNote: "华东飞轮已成立，华南团队建立中", failSignal: null, signalSource: null, signalAt: null },
  { id: "p5", code: "P5", premise: "资本供给充足：能持续获得增长期运营资金，现金runway维持>3个月", category: "market", confidence: 30, fragility: 95, lastValidatedAt: "2026-06-15", validationNote: "当前runway 2.1个月，已触发一票否决", failSignal: "现金runway跌至2.1月，低于安全线3个月", signalSource: "FPA 2026-06-15", signalAt: "2026-06-15" },
  { id: "p6", code: "P6", premise: "供应链稳定：不出现芯片/铜管/压缩机等核心零部件的大幅涨价或断供", category: "technology", confidence: 70, fragility: 65, lastValidatedAt: "2026-04-01", validationNote: "目前稳定，全球地缘风险仍存", failSignal: null, signalSource: null, signalAt: null },
];

function buildNorthStarFromPlan(
  plan: NonNullable<Awaited<ReturnType<typeof getActiveStrategicPlan>>["plan"]>,
  nsRow: Awaited<ReturnType<typeof prisma.companyNorthStar.findFirst>> | null,
): NorthStar {
  return {
    id: `plan-${plan.id}`,
    mission: plan.intent?.trim() || nsRow?.mission || DEMO_NORTH_STAR.mission,
    vision: plan.northStar?.trim() || nsRow?.vision || DEMO_NORTH_STAR.vision,
    targetYear: plan.targetYear ?? nsRow?.targetYear ?? DEMO_NORTH_STAR.targetYear,
    revenueTarget: plan.revenueTarget ?? (nsRow ? Number(nsRow.revenueTarget) : DEMO_NORTH_STAR.revenueTarget),
    profitMarginTarget:
      plan.profitMarginTarget ??
      (nsRow ? Number(nsRow.profitMarginTarget) : DEMO_NORTH_STAR.profitMarginTarget),
    marketPositionDesc: plan.marketPositionDesc ?? nsRow?.marketPositionDesc ?? DEMO_NORTH_STAR.marketPositionDesc,
    geographyDesc: plan.geographyDesc ?? nsRow?.geographyDesc ?? DEMO_NORTH_STAR.geographyDesc,
    brandDesc: plan.brandDesc ?? nsRow?.brandDesc ?? DEMO_NORTH_STAR.brandDesc,
  };
}

function mapLegacyPremises(
  rows: Array<{
    id: string;
    code: string;
    premise: string;
    category: string;
    confidence: number;
    fragility: number;
    lastValidatedAt: Date | null;
    validationNote: string | null;
    failSignal: string | null;
    signalSource: string | null;
    signalAt: Date | null;
  }>,
): PremiseAudit[] {
  return rows.map((p) => ({
    id: p.id,
    code: p.code,
    premise: p.premise,
    category: p.category,
    confidence: p.confidence,
    fragility: p.fragility,
    lastValidatedAt: p.lastValidatedAt?.toISOString().slice(0, 10) ?? null,
    validationNote: p.validationNote,
    failSignal: p.failSignal,
    signalSource: p.signalSource,
    signalAt: p.signalAt?.toISOString().slice(0, 10) ?? null,
  }));
}

export async function getCompassBundle(): Promise<CompassBundle> {
  const currentYear = new Date().getFullYear();

  try {
    const [nsRow, fpaPeriod, planResult] = await Promise.all([
      prisma.companyNorthStar.findFirst({
        where: { active: true },
        include: { premiseAudit: true, milestones: { orderBy: { year: "asc" } } },
      }),
      prisma.fpaPeriod.findFirst({ where: { period: "2026-FY", scope: "company" } }),
      getActiveStrategicPlan(),
    ]);

    const activePlan = planResult.plan;
    const planSource = planResult.source;

    const currentRevenue = fpaPeriod ? Number(fpaPeriod.revenueActual) : 5120;
    const currentMargin =
      fpaPeriod && Number(fpaPeriod.revenueActual) > 0
        ? Number(fpaPeriod.profitActual ?? 0) / Number(fpaPeriod.revenueActual)
        : 0.14;

    if (activePlan && hasPlanContent(activePlan)) {
      await ensurePlanMilestones(activePlan.id);
      await ensurePlanPremises(activePlan.id);

      try {
        await refreshPlanCompassAudit(activePlan.id, { assumptions: false, signals: true });
      } catch {
        /* offline */
      }

      const [planMilestones, planPremises] = await Promise.all([
        ensurePlanMilestones(activePlan.id),
        ensurePlanPremises(activePlan.id),
      ]);

      const premises =
        planPremises.length > 0 ? planPremisesToCompass(planPremises) : DEMO_PREMISES;

      const milestonesRaw =
        planMilestones.length > 0 ? planMilestonesToCompass(planMilestones) : DEMO_MILESTONES;
      const scored = scoreMilestones(milestonesRaw, premises, currentRevenue, currentYear);
      const northStar = buildNorthStarFromPlan(activePlan, nsRow);

      return {
        northStar,
        milestones: scored,
        premises,
        currentRevenue,
        currentMargin,
        planSource,
        planId: activePlan.id,
        planBsc: planObjectivesToBscRows(activePlan.objectives),
      };
    }

    if (!nsRow) {
      const scored = scoreMilestones(DEMO_MILESTONES, DEMO_PREMISES, currentRevenue, currentYear);
      return {
        northStar: DEMO_NORTH_STAR,
        milestones: scored,
        premises: DEMO_PREMISES,
        currentRevenue,
        currentMargin,
        planSource: "demo",
      };
    }

    if (nsRow.premiseAudit.length === 0 || nsRow.milestones.length === 0) {
      await ensureCompassChildren(
        nsRow.id,
        {
          targetYear: nsRow.targetYear,
          revenueTarget: Number(nsRow.revenueTarget),
          profitMarginTarget: Number(nsRow.profitMarginTarget),
        },
        currentYear,
        currentRevenue,
      );
    }

    try {
      await refreshCompassAudit(nsRow.id, { assumptions: false, signals: true });
    } catch {
      /* offline */
    }

    const refreshed = await prisma.companyNorthStar.findUnique({
      where: { id: nsRow.id },
      include: { premiseAudit: true, milestones: { orderBy: { year: "asc" } } },
    });
    const ns = refreshed ?? nsRow;

    const northStar: NorthStar = {
      id: ns.id,
      mission: ns.mission,
      vision: ns.vision,
      targetYear: ns.targetYear,
      revenueTarget: Number(ns.revenueTarget),
      profitMarginTarget: Number(ns.profitMarginTarget),
      marketPositionDesc: ns.marketPositionDesc,
      geographyDesc: ns.geographyDesc,
      brandDesc: ns.brandDesc,
    };

    const legacyMilestones: CompassMilestone[] = ns.milestones.map((m) => ({
      id: m.id,
      year: m.year,
      label: m.label,
      revenueTarget: m.revenueTarget ? Number(m.revenueTarget) : null,
      profitMarginTarget: m.profitMarginTarget ? Number(m.profitMarginTarget) : null,
      keyConditions: m.keyConditions,
      revenueActual: m.revenueActual ? Number(m.revenueActual) : null,
      progressNote: m.progressNote,
      riskScore: m.riskScore,
      riskFactors: m.riskFactors,
    }));

    const premises =
      ns.premiseAudit.length > 0 ? mapLegacyPremises(ns.premiseAudit) : DEMO_PREMISES;
    const milestonesRaw = legacyMilestones.length > 0 ? legacyMilestones : DEMO_MILESTONES;
    const scored = scoreMilestones(milestonesRaw, premises, currentRevenue, currentYear);

    return {
      northStar,
      milestones: scored,
      premises,
      currentRevenue,
      currentMargin,
      planSource: "demo",
      planId: activePlan?.id,
    };
  } catch {
    const currentRevenue = 5120;
    const scored = scoreMilestones(DEMO_MILESTONES, DEMO_PREMISES, currentRevenue, currentYear);
    return {
      northStar: DEMO_NORTH_STAR,
      milestones: scored,
      premises: DEMO_PREMISES,
      currentRevenue,
      currentMargin: 0.14,
      planSource: "demo",
    };
  }
}
