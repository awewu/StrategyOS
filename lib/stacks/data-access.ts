import { dbAvailable, prisma } from "@/lib/db";
import * as demo from "@/lib/stratos-demo-data";
import type {
  BetGateStatus,
  CapStackPeriod,
  FpaToggle,
  GtmBet,
  Horizon,
  InvestmentCase,
  ProductBet,
  Project,
} from "@/lib/types/stratos";

const PERIOD = demo.CURRENT_PERIOD;

export type StacksBundle = {
  capStack: CapStackPeriod;
  investmentCases: InvestmentCase[];
  productBets: ProductBet[];
  gtmBets: GtmBet[];
  projects: Project[];
  source: "database" | "demo";
};

async function seedStacksIfEmpty(period: string): Promise<void> {
  const [ic, pb, gb, proj, cap] = await Promise.all([
    prisma.investmentCase.count({ where: { period } }),
    prisma.productBet.count({ where: { period } }),
    prisma.gtmBet.count({ where: { period } }),
    prisma.project.count({ where: { period } }),
    prisma.capStackPeriod.count({ where: { period } }),
  ]);
  if (cap === 0) {
    const c = demo.capStack;
    await prisma.capStackPeriod.create({
      data: {
        period,
        capexBudget: c.capexBudget,
        capexCommitted: c.capexForecast,
        capexSpent: c.capexActual,
        opexInvestmentBudget: 1200,
        byHorizonJson: c.byHorizon,
        byBrandJson: c.byBrand,
        byTypeJson: c.byType,
        cashPeakMonth: c.cashPeakMonth,
        cashPeakAmount: c.cashPeakAmount,
        runwayAfterPeak: c.runwayAfterPeak,
      },
    });
  }
  if (ic === 0) {
    for (const item of demo.investmentCases) {
      await prisma.investmentCase.create({
        data: {
          code: item.code,
          title: item.title,
          type: item.type as "brand" | "capacity" | "strategic" | "technology" | "people",
          horizon: item.horizon,
          period,
          capexTotal: item.capexTotal,
          expectedIrr: item.expectedIrr ? item.expectedIrr / 100 : null,
          gateStatus: item.gateStatus,
          budgetTag: item.budgetTag,
          fpaToggle: item.fpaToggle,
        },
      });
    }
  }
  if (pb === 0) {
    for (const item of demo.productBets) {
      await prisma.productBet.create({
        data: {
          title: item.title,
          period,
          horizon: item.horizon,
          gateStatus: item.gateStatus,
          budgetTag: item.budgetTag ?? null,
          fpaToggle: item.fpaToggle,
          successCriteria: [],
          killCriteria: [],
          linkedVxIds: [],
        },
      });
    }
  }
  if (gb === 0) {
    for (const item of demo.gtmBets) {
      await prisma.gtmBet.create({
        data: {
          title: item.title,
          period,
          gateStatus: item.gateStatus,
          budgetTag: item.budgetTag ?? null,
          fpaToggle: item.fpaToggle,
          successCriteria: [],
          killCriteria: [],
          linkedAssumptionIds: [],
          doctrineTags: [],
        },
      });
    }
  }
  if (proj === 0) {
    for (const p of demo.projects) {
      await prisma.project.create({
        data: {
          code: p.code,
          name: p.name,
          period,
          cynefinDomain: p.cynefinDomain,
          horizon: p.horizon ?? null,
          progressPercent: p.progressPercent,
          status: p.status,
          budgetTotal: p.budgetTotal,
          budgetSpent: p.budgetSpent,
          riskLevel: p.riskLevel,
        },
      });
    }
  }
}

function mapIc(r: {
  id: string;
  code: string;
  title: string;
  type: string;
  horizon: Horizon;
  capexTotal: unknown;
  expectedIrr: unknown;
  gateStatus: BetGateStatus;
  budgetTag: string;
  fpaToggle: FpaToggle;
}): InvestmentCase {
  return {
    id: r.id,
    code: r.code,
    title: r.title,
    type: r.type,
    horizon: r.horizon,
    capexTotal: Number(r.capexTotal ?? 0),
    expectedIrr: r.expectedIrr ? Number(r.expectedIrr) * 100 : undefined,
    gateStatus: r.gateStatus,
    budgetTag: r.budgetTag,
    fpaToggle: r.fpaToggle,
  };
}

function mapProject(r: {
  id: string;
  code: string;
  name: string;
  cynefinDomain: Project["cynefinDomain"];
  horizon: Horizon | null;
  progressPercent: unknown;
  status: Project["status"];
  budgetTotal: unknown;
  budgetSpent: unknown;
  riskLevel: Project["riskLevel"];
  owner: { name: string } | null;
}): Project {
  return {
    id: r.id,
    code: r.code,
    name: r.name,
    cynefinDomain: r.cynefinDomain,
    horizon: r.horizon ?? undefined,
    progressPercent: Number(r.progressPercent ?? 0),
    status: r.status,
    budgetTotal: Number(r.budgetTotal ?? 0),
    budgetSpent: Number(r.budgetSpent ?? 0),
    riskLevel: r.riskLevel,
    owner: r.owner?.name,
  };
}

export async function getStacksBundle(period = PERIOD): Promise<StacksBundle> {
  if (!(await dbAvailable())) {
    return {
      capStack: demo.capStack,
      investmentCases: demo.investmentCases,
      productBets: demo.productBets,
      gtmBets: demo.gtmBets,
      projects: demo.projects,
      source: "demo",
    };
  }
  try {
    await seedStacksIfEmpty(period);
    const [capRow, ics, pbs, gbs, projs] = await Promise.all([
    prisma.capStackPeriod.findFirst({ where: { period } }),
    prisma.investmentCase.findMany({ where: { period } }),
    prisma.productBet.findMany({ where: { period } }),
    prisma.gtmBet.findMany({ where: { period } }),
    prisma.project.findMany({
      where: { period },
      include: { owner: { select: { name: true } } },
      orderBy: { code: "asc" },
    }),
  ]);
  const capStack: CapStackPeriod = capRow
    ? {
        period: capRow.period,
        capexBudget: Number(capRow.capexBudget),
        capexActual: Number(capRow.capexSpent),
        capexForecast: Number(capRow.capexCommitted),
        byHorizon: capRow.byHorizonJson as CapStackPeriod["byHorizon"],
        byBrand: (capRow.byBrandJson ?? {}) as Record<string, number>,
        byType: (capRow.byTypeJson ?? {}) as Record<string, number>,
        cashPeakMonth: capRow.cashPeakMonth ?? demo.capStack.cashPeakMonth,
        cashPeakAmount: Number(capRow.cashPeakAmount ?? demo.capStack.cashPeakAmount),
        runwayAfterPeak: Number(capRow.runwayAfterPeak ?? demo.capStack.runwayAfterPeak),
      }
    : demo.capStack;
  return {
    capStack,
    investmentCases: ics.length ? ics.map(mapIc) : demo.investmentCases,
    productBets: pbs.length
      ? pbs.map((r) => ({
          id: r.id,
          title: r.title,
          horizon: r.horizon,
          gateStatus: r.gateStatus,
          budgetTag: r.budgetTag ?? undefined,
          fpaToggle: r.fpaToggle,
        }))
      : demo.productBets,
    gtmBets: gbs.length
      ? gbs.map((r) => ({
          id: r.id,
          title: r.title,
          gateStatus: r.gateStatus,
          budgetTag: r.budgetTag ?? undefined,
          fpaToggle: r.fpaToggle,
        }))
      : demo.gtmBets,
    projects: projs.length ? projs.map(mapProject) : demo.projects,
    source: "database",
  };
  } catch {
    return {
      capStack: demo.capStack,
      investmentCases: demo.investmentCases,
      productBets: demo.productBets,
      gtmBets: demo.gtmBets,
      projects: demo.projects,
      source: "demo",
    };
  }
}

export async function saveCapStack(
  capStack: CapStackPeriod,
  period = PERIOD,
): Promise<void> {
  if (!(await dbAvailable())) throw new Error("DATABASE_URL unset — 无法保存 CapStack");
  await seedStacksIfEmpty(period);
  await prisma.capStackPeriod.upsert({
    where: { period },
    create: {
      period,
      capexBudget: capStack.capexBudget,
      capexCommitted: capStack.capexForecast,
      capexSpent: capStack.capexActual,
      opexInvestmentBudget: 1200,
      byHorizonJson: capStack.byHorizon,
      byBrandJson: capStack.byBrand,
      byTypeJson: capStack.byType,
      cashPeakMonth: capStack.cashPeakMonth,
      cashPeakAmount: capStack.cashPeakAmount,
      runwayAfterPeak: capStack.runwayAfterPeak,
    },
    update: {
      capexBudget: capStack.capexBudget,
      capexCommitted: capStack.capexForecast,
      capexSpent: capStack.capexActual,
      byHorizonJson: capStack.byHorizon,
      byBrandJson: capStack.byBrand,
      byTypeJson: capStack.byType,
      cashPeakMonth: capStack.cashPeakMonth,
      cashPeakAmount: capStack.cashPeakAmount,
      runwayAfterPeak: capStack.runwayAfterPeak,
    },
  });
}

export async function saveInvestmentCases(
  items: InvestmentCase[],
  period = PERIOD,
): Promise<void> {
  if (!(await dbAvailable())) throw new Error("DATABASE_URL unset — 无法保存投资案");
  for (const ic of items) {
    await prisma.investmentCase.upsert({
      where: { code: ic.code },
      create: {
        code: ic.code,
        title: ic.title,
        type: ic.type as "brand" | "capacity" | "strategic" | "technology" | "people",
        horizon: ic.horizon,
        period,
        capexTotal: ic.capexTotal,
        expectedIrr: ic.expectedIrr ? ic.expectedIrr / 100 : null,
        gateStatus: ic.gateStatus,
        budgetTag: ic.budgetTag,
        fpaToggle: ic.fpaToggle,
      },
      update: {
        title: ic.title,
        capexTotal: ic.capexTotal,
        expectedIrr: ic.expectedIrr ? ic.expectedIrr / 100 : null,
        gateStatus: ic.gateStatus,
        budgetTag: ic.budgetTag,
        fpaToggle: ic.fpaToggle,
        horizon: ic.horizon,
      },
    });
  }
}

export async function saveProductBets(items: ProductBet[], period = PERIOD): Promise<void> {
  if (!(await dbAvailable())) throw new Error("DATABASE_URL unset — 无法保存产品栈");
  for (const pb of items) {
    if (pb.id.startsWith("pb-") || pb.id.length < 20) {
      await prisma.productBet.create({
        data: {
          title: pb.title,
          period,
          horizon: pb.horizon,
          gateStatus: pb.gateStatus,
          budgetTag: pb.budgetTag ?? null,
          fpaToggle: pb.fpaToggle,
          successCriteria: [],
          killCriteria: [],
          linkedVxIds: [],
        },
      });
    } else {
      await prisma.productBet.update({
        where: { id: pb.id },
        data: {
          title: pb.title,
          horizon: pb.horizon,
          gateStatus: pb.gateStatus,
          budgetTag: pb.budgetTag ?? null,
          fpaToggle: pb.fpaToggle,
        },
      });
    }
  }
}

export async function saveGtmBets(items: GtmBet[], period = PERIOD): Promise<void> {
  if (!(await dbAvailable())) throw new Error("DATABASE_URL unset — 无法保存渠道栈");
  for (const gb of items) {
    if (gb.id.startsWith("gtm-") || gb.id.length < 20) {
      await prisma.gtmBet.create({
        data: {
          title: gb.title,
          period,
          gateStatus: gb.gateStatus,
          budgetTag: gb.budgetTag ?? null,
          fpaToggle: gb.fpaToggle,
          successCriteria: [],
          killCriteria: [],
          linkedAssumptionIds: [],
          doctrineTags: [],
        },
      });
    } else {
      await prisma.gtmBet.update({
        where: { id: gb.id },
        data: {
          title: gb.title,
          gateStatus: gb.gateStatus,
          budgetTag: gb.budgetTag ?? null,
          fpaToggle: gb.fpaToggle,
        },
      });
    }
  }
}

export async function saveProjects(items: Project[], period = PERIOD): Promise<void> {
  if (!(await dbAvailable())) throw new Error("DATABASE_URL unset — 无法保存 Vx 项目");
  for (const p of items) {
    await prisma.project.upsert({
      where: { code: p.code },
      create: {
        code: p.code,
        name: p.name,
        period,
        cynefinDomain: p.cynefinDomain,
        horizon: p.horizon ?? null,
        progressPercent: p.progressPercent,
        status: p.status,
        budgetTotal: p.budgetTotal,
        budgetSpent: p.budgetSpent,
        riskLevel: p.riskLevel,
      },
      update: {
        name: p.name,
        cynefinDomain: p.cynefinDomain,
        horizon: p.horizon ?? null,
        progressPercent: p.progressPercent,
        status: p.status,
        budgetTotal: p.budgetTotal,
        budgetSpent: p.budgetSpent,
        riskLevel: p.riskLevel,
      },
    });
  }
}
