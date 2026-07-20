/**
 * Entity-level DB getters — demo fallback when DATABASE_URL unset or empty tables.
 */
import { dbAvailable, prisma, safeDbQuery } from "@/lib/db";
import * as demo from "@/lib/stratos-demo-data";
import { demoHealthOverview } from "@/lib/stratos-demo-data";
import { getActivePeriod } from "@/lib/data/active-period";
import { toBscDimKey } from "@/lib/decode/bsc-dimensions";
import type {
  Assumption,
  BrandStrategyCard,
  BrandCode,
  CapacitySnapshot,
  GtmBet,
  KeyResult,
  ProductBet,
  Project,
  Scenario,
  TrafficLight,
} from "@/lib/types/stratos";


export async function getBrandCards(): Promise<BrandStrategyCard[]> {
  if (!(await dbAvailable())) return demo.brandCards;
  const rows = await prisma.brandStrategyCard.findMany({ where: { period: await getActivePeriod() } });
  if (rows.length === 0) return demo.brandCards;
  return rows.map((r) => {
    const wtp = r.whereToPlayJson as { summary?: string } | string;
    const whereToPlay =
      typeof wtp === "string" ? wtp : (wtp?.summary ?? JSON.stringify(wtp));
    return {
      brandCode: r.brandCode as BrandCode,
      winningAspiration: r.winningAspiration,
      whereToPlay,
      howToWin: r.howToWin,
    };
  });
}

export async function getProductBets(): Promise<ProductBet[]> {
  if (!(await dbAvailable())) return demo.productBets;
  const rows = await prisma.productBet.findMany({ where: { period: await getActivePeriod() } });
  if (rows.length === 0) return demo.productBets;
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    horizon: r.horizon,
    gateStatus: r.gateStatus,
    budgetTag: r.budgetTag ?? undefined,
    fpaToggle: r.fpaToggle,
  }));
}

export async function getGtmBets(): Promise<GtmBet[]> {
  if (!(await dbAvailable())) return demo.gtmBets;
  const rows = await prisma.gtmBet.findMany({ where: { period: await getActivePeriod() } });
  if (rows.length === 0) return demo.gtmBets;
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    gateStatus: r.gateStatus,
    budgetTag: r.budgetTag ?? undefined,
    fpaToggle: r.fpaToggle,
  }));
}

export async function getProjects(): Promise<Project[]> {
  return safeDbQuery(async () => {
    const rows = await prisma.project.findMany({
      where: { period: await getActivePeriod() },
      include: { owner: { select: { name: true } } },
    });
    if (rows.length === 0) return demo.projects;
    return rows.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      cynefinDomain: r.cynefinDomain,
      horizon: r.horizon ?? undefined,
      progressPercent: Number(r.progressPercent ?? 0),
      status: r.status as Project["status"],
      budgetTotal: Number(r.budgetTotal ?? 0),
      budgetSpent: Number(r.budgetSpent ?? 0),
      riskLevel: r.riskLevel as Project["riskLevel"],
      owner: r.owner?.name,
    }));
  }, demo.projects);
}

export async function getAssumptions(): Promise<Assumption[]> {
  if (!(await dbAvailable())) return demo.assumptions;
  const rows = await prisma.assumption.findMany({ where: { period: await getActivePeriod() } });
  if (rows.length === 0) return demo.assumptions;
  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    content: r.content,
    cynefinDomain: r.cynefinDomain,
    result: r.result as Assumption["result"],
  }));
}

export interface ObjectiveView {
  id: string;
  title: string;
}

export async function getObjectives(): Promise<ObjectiveView[]> {
  if (!(await dbAvailable())) return demo.objectives;
  const rows = await prisma.objective.findMany({ where: { period: await getActivePeriod() }, orderBy: { createdAt: "asc" } });
  if (rows.length === 0) return demo.objectives;
  return rows.map((r) => ({ id: r.id, title: r.title }));
}

export async function getAllKeyResults(): Promise<KeyResult[]> {
  if (!(await dbAvailable())) return [...demo.leadingKrs, ...demo.laggingKrs];
  const rows = await prisma.keyResult.findMany({ where: { period: await getActivePeriod() }, orderBy: { title: "asc" } });
  if (rows.length === 0) return [...demo.leadingKrs, ...demo.laggingKrs];
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    budgetTag: r.budgetTag ?? undefined,
    targetValue: r.targetValue ?? undefined,
    currentValue: r.currentValue ?? undefined,
    confidence: r.confidence ? Number(r.confidence) : undefined,
    isLeadingIndicator: r.isLeadingIndicator,
  }));
}

export async function getLeadingKeyResults(): Promise<KeyResult[]> {
  if (!(await dbAvailable())) return demo.leadingKrs;
  const rows = await prisma.keyResult.findMany({
    where: { period: await getActivePeriod(), isLeadingIndicator: true },
  });
  if (rows.length === 0) return demo.leadingKrs;
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    budgetTag: r.budgetTag ?? undefined,
    targetValue: r.targetValue ?? undefined,
    currentValue: r.currentValue ?? undefined,
    confidence: r.confidence ? Number(r.confidence) : undefined,
    isLeadingIndicator: true,
  }));
}

export async function getCapacity(): Promise<CapacitySnapshot> {
  if (!(await dbAvailable())) return demo.capacity;
  const row = await prisma.capacitySnapshot.findFirst({
    where: { period: await getActivePeriod() },
    orderBy: { recordedAt: "desc" },
    include: { linkedInvestmentCase: true },
  });
  if (!row) return demo.capacity;
  return {
    demandUnits: Number(row.demandUnits),
    capacityUnits: Number(row.capacityUnits),
    gapUnits: Number(row.gapUnits),
    utilizationPct: Number(row.utilizationPct),
    gapAction: row.gapAction,
    linkedIcCode: row.linkedInvestmentCase?.code,
  };
}

export async function getBscLights(): Promise<{
  financial: TrafficLight;
  customer: TrafficLight;
  process: TrafficLight;
  learning: TrafficLight;
}> {
  if (!(await dbAvailable())) return demo.bscLights;
  const rows = await prisma.healthSignal.findMany({ where: { period: await getActivePeriod() } });
  if (rows.length === 0) return demo.bscLights;
  const map: Record<string, TrafficLight> = {};
  for (const r of rows) {
    const key = toBscDimKey(r.dimension);
    if (key) {
      map[key] = r.signal as TrafficLight;
    }
  }
  return {
    financial: map.financial ?? demo.bscLights.financial,
    customer: map.customer ?? demo.bscLights.customer,
    process: map.process ?? demo.bscLights.process,
    learning: map.learning ?? demo.bscLights.learning,
  };
}

export interface HealthOverviewData {
  score: number;
  quarter: string;
  dimensions: {
    financial: TrafficLight;
    customer: TrafficLight;
    process: TrafficLight;
    learning: TrafficLight;
  };
  kpis: Array<{
    name: string;
    value: string;
    target: string;
    status: TrafficLight;
  }>;
}

export async function getHealthOverview(): Promise<HealthOverviewData> {
  const [lights, activePeriod] = await Promise.all([getBscLights(), getActivePeriod()]);
  if (!(await dbAvailable())) {
    return {
      ...demoHealthOverview,
      quarter: activePeriod,
      dimensions: lights,
    };
  }
  const kpiRows = await prisma.healthSignal.findMany({
    where: { period: activePeriod, kpiName: { not: null } },
  });
  if (kpiRows.length === 0) {
    return { ...demoHealthOverview, quarter: activePeriod, dimensions: lights };
  }
  const kpis = kpiRows
    .filter((r) => r.kpiName)
    .map((r) => ({
      name: r.kpiName!,
      value: r.kpiValue ?? "—",
      target: r.kpiTarget ?? "—",
      status: r.signal as TrafficLight,
    }));
  const score = Math.round(
    (["financial", "customer", "process", "learning"] as const).reduce((acc, dim) => {
      const s = lights[dim];
      return acc + (s === "green" ? 25 : s === "yellow" ? 15 : 5);
    }, 0)
  );
  return {
    score,
    quarter: activePeriod,
    dimensions: lights,
    kpis: kpis.length >= 4 ? kpis : demoHealthOverview.kpis,
  };
}

export async function getBscCards() {
  const { getBscConfig, mergeBscCardsWithLights } = await import("@/lib/fpa/bsc-config-access");
  const [config, lights] = await Promise.all([getBscConfig(await getActivePeriod()), getBscLights()]);
  return mergeBscCardsWithLights(config.cards, lights);
}

export async function getProductRoadmap() {
  if (!(await dbAvailable())) return demo.productRoadmap;
  const rows = await prisma.productRoadmapItem.findMany({
    include: { productLine: true },
    take: 20,
  });
  if (rows.length === 0) return demo.productRoadmap;
  return rows.map((r) => ({
    lane: r.lane,
    milestone: r.milestone,
    quarter: r.targetQuarter,
    status: r.status,
    product: r.productLine.name,
  }));
}

export async function getJtbdCards() {
  if (!(await dbAvailable())) return demo.jtbdCards;
  const rows = await prisma.jtbdCard.findMany({ include: { productLine: true } });
  if (rows.length === 0) return demo.jtbdCards;
  return rows.map((r) => ({
    product: r.productLine.name,
    statement: r.statement,
    segment: r.primarySegment,
  }));
}

export async function getProductGaps() {
  if (!(await dbAvailable())) return demo.productGaps;
  const rows = await prisma.competitiveProductGap.findMany({
    include: { productLine: true, closureVx: true },
  });
  if (rows.length === 0) return demo.productGaps;
  return rows.map((r) => ({
    competitor: r.competitor,
    dimension: r.dimension,
    status: r.ourStatus,
    closure: r.closureVx?.code ?? "—",
  }));
}

export async function getGtmSegments() {
  if (!(await dbAvailable())) return demo.gtmSegments;
  const rows = await prisma.customerSegment.findMany({ take: 10 });
  if (rows.length === 0) return demo.gtmSegments;
  const coverage = await prisma.coverageSnapshot.findMany({ where: { period: await getActivePeriod() } });
  const economics = await prisma.segmentEconomics.findMany({ where: { period: await getActivePeriod() } });
  return rows.map((r) => {
    const cov = coverage.find((c) => c.segmentCode === r.code);
    const econ = economics.find((e) => e.segmentId === r.id);
    const ltvCac = econ?.ltvCacRatio
      ? `${Number(econ.ltvCacRatio)}:1 · ${econ.signal === "yellow" ? "黄" : econ.signal === "red" ? "红" : "绿"}`
      : "—";
    return {
      code: r.code,
      name: r.name,
      priority: r.priority,
      coverage: cov ? `${cov.actualCount}/${cov.targetCount}` : "—",
      ltvCac,
    };
  });
}

export async function getCapitalSummaryLine(): Promise<string> {
  const [cs, capacity] = await Promise.all([getCapStackInline(), getCapacity()]);
  return `FY CAPEX ${(cs.capexBudget / 10000).toFixed(1)}亿 · H2 ${cs.byHorizon.H2}% · ${cs.cashPeakMonth.slice(5)}月波峰 · 缺口${(capacity.gapUnits / 10000).toFixed(1)}万台`;
}

async function getCapStackInline() {
  if (!(await dbAvailable())) return demo.capStack;
  const row = await prisma.capStackPeriod.findFirst({ where: { period: await getActivePeriod() } });
  if (!row) return demo.capStack;
  const byHorizon = row.byHorizonJson as Record<"H1" | "H2" | "H3", number>;
  return {
    period: row.period,
    capexBudget: Number(row.capexBudget),
    capexActual: Number(row.capexSpent),
    capexForecast: Number(row.capexCommitted),
    byHorizon,
    cashPeakMonth: row.cashPeakMonth ?? demo.capStack.cashPeakMonth,
    cashPeakAmount: Number(row.cashPeakAmount ?? demo.capStack.cashPeakAmount),
    runwayAfterPeak: Number(row.runwayAfterPeak ?? demo.capStack.runwayAfterPeak),
  };
}

export async function getScenarios(): Promise<Scenario[]> {
  if (!(await dbAvailable())) return demo.spbpScenarios;
  const period = await getActivePeriod();
  const rows = await prisma.spbpScenario.findMany({ where: { period } });
  if (rows.length === 0) return demo.spbpScenarios;
  return rows.map((r) => ({
    id: r.code,
    name: r.name,
    probability: Number(r.probability),
    drivers: [] as string[],
    fpaImpact: { revenue: 0, profit: 0, runwayMonths: 0 },
    linkedAssumptionCodes: [],
  }));
}
