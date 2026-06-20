/**
 * Unified data access — DB when available, demo fallback otherwise.
 */
import { dbAvailable, prisma } from "@/lib/db";
import * as entities from "@/lib/data/entity-getters";
import * as demo from "@/lib/stratos-demo-data";
import { buildManagementReport } from "@/lib/fpa/management-report";
import type { ManagementReportBundle } from "@/lib/fpa/management-types";
import { computeRobustOverall } from "@/lib/stratos/robust-score";
import type {
  CapStackPeriod,
  FpaSummary,
  HealthAssertion,
  InvestmentCase,
  RobustnessDimensions,
  StrategicDiagnosis,
} from "@/lib/types/stratos";

export type DataSource = "database" | "demo";

export async function getDataSource(): Promise<DataSource> {
  return (await dbAvailable()) ? "database" : "demo";
}

export async function getDiagnosis(): Promise<StrategicDiagnosis> {
  if (!(await dbAvailable())) return demo.diagnosis;
  const row = await prisma.strategicDiagnosis.findFirst({
    where: { status: "approved" },
    orderBy: { approvedAt: "desc" },
  });
  if (!row) return demo.diagnosis;
  return {
    id: row.id,
    period: row.period,
    challengeStatement: row.challengeStatement,
    bottleneckType: row.bottleneckType,
    crux: row.crux,
    status: row.status as "approved" | "draft",
  };
}

export async function getInvestmentCases(): Promise<InvestmentCase[]> {
  if (!(await dbAvailable())) return demo.investmentCases;
  const rows = await prisma.investmentCase.findMany({ take: 20 });
  if (rows.length === 0) return demo.investmentCases;
  return rows.map((r) => ({
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
  }));
}

export async function getActiveHealthAssertions(): Promise<HealthAssertion[]> {
  if (!(await dbAvailable())) return [demo.healthAssertion];
  const rows = await prisma.healthAssertion.findMany({ where: { active: true } });
  if (rows.length === 0) return [demo.healthAssertion];
  return rows.map((r) => ({
    id: r.id,
    assertionType: r.assertionType,
    active: r.active,
    message: r.message,
    metricValue: r.metricValue ? Number(r.metricValue) : undefined,
    thresholdValue: r.thresholdValue ? Number(r.thresholdValue) : undefined,
    sourceReportId: r.sourceReportId ?? undefined,
  }));
}

export async function getFpaSummary(): Promise<FpaSummary> {
  if (!(await dbAvailable())) return demo.fpa;
  const row = await prisma.fpaPeriod.findFirst({
    where: { period: demo.CURRENT_PERIOD, scope: "company" },
  });
  const cash = await prisma.cashPosition.findFirst({
    where: { period: demo.CURRENT_PERIOD },
    orderBy: { asOfDate: "desc" },
  });
  if (!row) return demo.fpa;
  return {
    revenueBudget: Number(row.revenueBudget),
    revenueActual: Number(row.revenueActual),
    revenueForecast: Number(row.revenueForecast),
    profitBudget: Number(row.profitBudget),
    profitActual: Number(row.profitActual),
    profitForecast: Number(row.profitForecast),
    cashRunwayMonths: cash ? Number(cash.runwayMonths) : demo.fpa.cashRunwayMonths,
  };
}

export async function getCapStack(): Promise<CapStackPeriod> {
  if (!(await dbAvailable())) return demo.capStack;
  const row = await prisma.capStackPeriod.findFirst({
    where: { period: demo.CURRENT_PERIOD },
  });
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

export async function getRobustScore(): Promise<RobustnessDimensions> {
  return entities.getRobustScore();
}

/** Bundle for command deck + PDF one-pager */
export async function getCommandDeckBundle() {
  const [diagnosis, fpa, assertions, source, spbpScenarios, capStack, investmentCases, bscLights, robust, managementReport] =
    await Promise.all([
      getDiagnosis(),
      getFpaSummary(),
      getActiveHealthAssertions(),
      getDataSource(),
      getSpbpScenarios(),
      getCapStack(),
      getInvestmentCases(),
      entities.getBscLights(),
      getRobustScore(),
      getManagementReport(),
    ]);
  return {
    source,
    diagnosis,
    fpa,
    managementReport,
    assertions,
    bscLights,
    robustScore: robust,
    robustOverall: computeRobustOverall(robust),
    stratDiffs: demo.stratDiffs,
    spbpScenarios,
    capStack,
    investmentCases,
  };
}

/** Strategy page bundle */
export async function getStrategyBundle() {
  const [
    diagnosis,
    investmentCases,
    capStack,
    source,
    brandCards,
    productBets,
    gtmBets,
    productRoadmap,
    jtbdCards,
    productGaps,
    gtmSegments,
    bscCards,
  ] = await Promise.all([
    getDiagnosis(),
    getInvestmentCases(),
    getCapStack(),
    getDataSource(),
    entities.getBrandCards(),
    entities.getProductBets(),
    entities.getGtmBets(),
    entities.getProductRoadmap(),
    entities.getJtbdCards(),
    entities.getProductGaps(),
    entities.getGtmSegments(),
    entities.getBscCards(),
  ]);
  return {
    source,
    diagnosis,
    investmentCases,
    capStack,
    brandCards,
    productBets,
    gtmBets,
    productRoadmap,
    jtbdCards,
    productGaps,
    gtmSegments,
    bscCards,
    aarrrFunnel: demo.aarrrFunnel,
    kellerBrandLayers: demo.kellerBrandLayers,
  };
}

/** Finance page bundle */
export async function getFinanceBundle() {
  const [fpa, capStack, investmentCases, spbpScenarios, maPipeline, source, managementReport] =
    await Promise.all([
      getFpaSummary(),
      getCapStack(),
      getInvestmentCases(),
      getSpbpScenarios(),
      getMaPipeline(),
      getDataSource(),
      getManagementReport(),
    ]);
  return {
    source,
    fpa,
    managementReport,
    capStack,
    capacity: await entities.getCapacity(),
    investmentCases,
    fiveYearForecast: demo.fiveYearForecast,
    sensitivityDrivers: demo.sensitivityDrivers,
    spbpScenarios,
    maPipeline,
    realOptions: demo.realOptions,
    postInvestDeviations: demo.postInvestDeviations,
  };
}

export async function getManagementReport(): Promise<ManagementReportBundle> {
  const fpa = await getFpaSummary();
  return buildManagementReport(fpa, demo.CURRENT_PERIOD);
}

/** Execution page bundle */
export async function getExecutionBundle() {
  const [diagnosis, techSignals, source, projects, assumptions, leadingKrs] = await Promise.all([
    getDiagnosis(),
    getTechSignals(),
    getDataSource(),
    entities.getProjects(),
    entities.getAssumptions(),
    entities.getLeadingKeyResults(),
  ]);
  return {
    source,
    diagnosis,
    leadingKrs,
    horizonBubbles: demo.horizonBubbles,
    projects,
    assumptions,
    techSignals,
    riceItems: demo.riceItems,
    trlRadar: demo.trlRadar,
  };
}

export async function getMaPipeline() {
  if (!(await dbAvailable())) return demo.maPipeline;
  const rows = await prisma.maPipelineItem.findMany({ orderBy: { stage: "asc" } });
  if (rows.length === 0) return demo.maPipeline;
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    direction: r.direction,
    stage: r.stage,
    synergyThesis: r.synergyThesis,
    valuationRange: r.valuationRange,
    linkedAssumptionCodes: r.linkedAssumptionCodes,
    integrationMilestone100d: r.integrationMilestone100d ?? undefined,
  }));
}

export async function getSpbpScenarios() {
  if (!(await dbAvailable())) return demo.spbpScenarios;
  const rows = await prisma.spbpScenario.findMany({ where: { period: demo.CURRENT_PERIOD } });
  if (rows.length === 0) return demo.spbpScenarios;
  return rows.map((r) => ({
    id: r.code,
    name: r.name,
    probability: Number(r.probability),
    drivers: r.drivers,
    fpaImpact: {
      revenue: Number(r.revenueImpact),
      profit: Number(r.profitImpact),
      runwayMonths: Number(r.runwayMonths),
    },
    linkedAssumptionCodes: r.linkedAssumptionCodes,
  }));
}

export async function getTechSignals() {
  if (!(await dbAvailable())) return demo.techSignals;
  const rows = await prisma.techSignalRecord.findMany({
    where: { period: demo.CURRENT_PERIOD },
    orderBy: { trl: "desc" },
  });
  if (rows.length === 0) return demo.techSignals;
  return rows.map((r) => ({
    id: r.id,
    domain: r.domain,
    title: r.title,
    trl: r.trl,
    source: r.source,
    horizon: r.horizon,
    linkedProjectCode: r.linkedProjectCode ?? undefined,
    urgency: r.urgency,
  }));
}

export interface ReportListItem {
  id: string;
  type: string;
  period: string;
  title: string;
  status: "parsed" | "pending" | "failed";
  patterns: string[];
}

export async function getReports(): Promise<ReportListItem[]> {
  if (!(await dbAvailable())) {
    return demo.reports.map((r) => ({
      id: r.id,
      type: r.type,
      period: r.period,
      title: r.title,
      status: r.status as "parsed" | "pending",
      patterns: r.patterns,
    }));
  }
  const rows = await prisma.report.findMany({ orderBy: { uploadedAt: "desc" }, take: 20 });
  if (rows.length === 0) {
    return demo.reports.map((r) => ({
      id: r.id,
      type: r.type,
      period: r.period,
      title: r.title,
      status: r.status as "parsed" | "pending",
      patterns: r.patterns,
    }));
  }
  return rows.map((r) => {
    const parsed = r.parsedJson as { patterns?: Array<{ title: string }> } | null;
    return {
      id: r.id,
      type: r.reportType,
      period: r.period,
      title: r.title,
      status: parsed ? "parsed" : "pending",
      patterns: parsed?.patterns?.map((p) => p.title) ?? [],
    };
  });
}

/** Health page bundle */
export async function getHealthBundle() {
  const [source, fpa, bscLights, healthOverview, robustScore] = await Promise.all([
    getDataSource(),
    getFpaSummary(),
    entities.getBscLights(),
    entities.getHealthOverview(),
    getRobustScore(),
  ]);
  return {
    source,
    fpa,
    bscLights,
    healthOverview,
    robustScore,
    robustOverall: computeRobustOverall(robustScore),
  };
}

/** Decode page bundle */
export async function getDecodeBundle() {
  const [source, loops] = await Promise.all([getDataSource(), entities.getFeedbackLoops()]);
  return { source, loops };
}

/** Q3 rehearsal live context */
export async function getRehearsalBundle() {
  const [deck, health, versions] = await Promise.all([
    getCommandDeckBundle(),
    getHealthBundle(),
    import("@/lib/data/versions-data").then((m) => m.getVersionsBundle()),
  ]);
  const activeAssertion = deck.assertions.find((a) => a.active);
  return {
    source: deck.source,
    crux: deck.diagnosis.crux,
    challenge: deck.diagnosis.challengeStatement,
    runwayMonths: deck.fpa.cashRunwayMonths,
    robustOverall: deck.robustOverall,
    bscLights: deck.bscLights,
    diffCount: versions.stratDiffs.length,
    workingSnapshotRate:
      versions.snapshots.find((s) => s.status === "WORKING")?.rate ?? 52,
    hardBlock: activeAssertion?.active
      ? activeAssertion.message
      : null,
  };
}

/** 市场洞察 bundle — Hermes 来源 / 信号 / 竞品轨迹 + 最近一次扫描 */
export async function getMarketIntelBundle() {
  const [source, intel, hermes] = await Promise.all([
    getDataSource(),
    import("@/lib/market-intel/demo-data"),
    import("@/lib/market-intel/hermes"),
  ]);
  const now = new Date();
  const sources = intel.demoSources.map((s) => ({
    ...s,
    health: hermes.sourceHealth(s, now),
  }));
  return {
    source,
    sources,
    signals: hermes.rankSignals(intel.demoSignals),
    tracks: intel.demoTracks,
    blindSpots: hermes.blindSpots(sources, now),
    lastScan: hermes.runHermesScan(sources, intel.demoSignals, now),
    agent: hermes.HERMES,
  };
}
