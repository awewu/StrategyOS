import { prisma } from "@/lib/db";

type NorthStarInput = {
  targetYear: number;
  revenueTarget: number;
  profitMarginTarget: number;
};

/** 从终点目标反推逐年里程碑（路径风险引擎的输入） */
export function deriveMilestoneYears(currentYear: number, targetYear: number): number[] {
  if (targetYear <= currentYear) return [targetYear];
  const span = targetYear - currentYear;
  if (span <= 4) {
    const years: number[] = [];
    for (let y = currentYear + 1; y <= targetYear; y++) years.push(y);
    return years;
  }
  const step = Math.max(1, Math.floor(span / 4));
  const years = new Set<number>([targetYear]);
  for (let y = currentYear + step; y < targetYear; y += step) years.add(y);
  years.add(currentYear + 1);
  return [...years].sort((a, b) => a - b);
}

export function deriveMilestoneRows(
  ns: NorthStarInput,
  currentYear: number,
  currentRevenue: number,
): {
  year: number;
  label: string;
  revenueTarget: number;
  profitMarginTarget: number;
  keyConditions: string[];
}[] {
  const years = deriveMilestoneYears(currentYear, ns.targetYear);
  const start = Math.max(currentRevenue, 1);
  const end = Math.max(ns.revenueTarget, start);
  const span = Math.max(ns.targetYear - currentYear, 1);

  return years.map((year) => {
    const progress = (year - currentYear) / span;
    const revenueTarget = Math.round(start * Math.pow(end / start, progress));
    const marginProgress = Math.min(1, progress);
    const profitMarginTarget =
      ns.profitMarginTarget * marginProgress + 0.05 * (1 - marginProgress);
    const label =
      year === ns.targetYear
        ? `终点 · ${(revenueTarget / 10000).toFixed(1)}亿级`
        : `${year} · 阶段性目标`;
    return {
      year,
      label,
      revenueTarget,
      profitMarginTarget: Math.round(profitMarginTarget * 1000) / 1000,
      keyConditions:
        year === currentYear + 1
          ? ["核心产品/渠道里程碑按时", "现金 runway 维持安全线", "关键岗位到位"]
          : year === ns.targetYear
            ? ["终点营收与利润率达标", "市场地位与品牌格局兑现", "组织能力支撑规模"]
            : ["上一阶段目标达成", "路径 CAGR 可延续", "前提假设无失效信号"],
    };
  });
}

const DEFAULT_PREMISE_TEMPLATES: {
  code: string;
  premise: string;
  category: string;
  confidence: number;
  fragility: number;
  validationNote: string;
}[] = [
  {
    code: "P1",
    premise: "目标市场容量与渗透率按规划增长，政策与需求侧无重大逆转",
    category: "market",
    confidence: 65,
    fragility: 60,
    validationNote: "待与 FPA / 市场情报交叉验证",
  },
  {
    code: "P2",
    premise: "主要竞争对手不发动颠覆性价格战或渠道封锁",
    category: "competition",
    confidence: 55,
    fragility: 80,
    validationNote: "建议绑定 Hermes 竞争信号自动审计",
  },
  {
    code: "P3",
    premise: "核心产品/平台能在计划窗口内完成产品化并上市",
    category: "technology",
    confidence: 60,
    fragility: 85,
    validationNote: "与解码 X-Matrix / Gate 里程碑联动",
  },
  {
    code: "P4",
    premise: "关键渠道与区域模式可复制到下一梯队市场",
    category: "capability",
    confidence: 60,
    fragility: 70,
    validationNote: "与执行监测 N-1 切片进度对照",
  },
  {
    code: "P5",
    premise: "资本与现金供给充足，runway 维持 HardBlock 安全线以上",
    category: "market",
    confidence: 50,
    fragility: 90,
    validationNote: "FPA 现金波峰 / runway 可自动写入失效信号",
  },
  {
    code: "P6",
    premise: "供应链与核心零部件价格/交期稳定，无断供级风险",
    category: "technology",
    confidence: 70,
    fragility: 65,
    validationNote: "季度采购与产能评审更新",
  },
];

/** 若 North Star 尚无子数据，自动生成里程碑 + 前提模板并落库 */
export async function ensureCompassChildren(
  northStarId: string,
  ns: NorthStarInput,
  currentYear: number,
  currentRevenue: number,
): Promise<{ milestonesCreated: number; premisesCreated: number }> {
  const existing = await prisma.companyNorthStar.findUnique({
    where: { id: northStarId },
    include: { milestones: true, premiseAudit: true },
  });
  if (!existing) return { milestonesCreated: 0, premisesCreated: 0 };

  let milestonesCreated = 0;
  let premisesCreated = 0;

  if (existing.milestones.length === 0) {
    const rows = deriveMilestoneRows(ns, currentYear, currentRevenue);
    await prisma.compassMilestone.createMany({
      data: rows.map((r) => ({
        northStarId,
        year: r.year,
        label: r.label,
        revenueTarget: r.revenueTarget,
        profitMarginTarget: r.profitMarginTarget,
        keyConditions: r.keyConditions,
        riskFactors: [],
      })),
    });
    milestonesCreated = rows.length;
  }

  if (existing.premiseAudit.length === 0) {
    await prisma.compassPremiseAudit.createMany({
      data: DEFAULT_PREMISE_TEMPLATES.map((p) => ({
        northStarId,
        code: p.code,
        premise: p.premise,
        category: p.category,
        confidence: p.confidence,
        fragility: p.fragility,
        validationNote: p.validationNote,
        lastValidatedAt: new Date(),
      })),
    });
    premisesCreated = DEFAULT_PREMISE_TEMPLATES.length;
  }

  return { milestonesCreated, premisesCreated };
}
