/**
 * Unified data access — DB when available, demo fallback otherwise.
 */
import { Prisma } from "@prisma/client";
import { dbAvailable, prisma, requireDbAvailable } from "@/lib/db";
import * as entities from "@/lib/data/entity-getters";
import * as demo from "@/lib/stratos-demo-data";
import { buildManagementReport } from "@/lib/fpa/management-report";
import { getActivePeriod } from "@/lib/data/active-period";
import { getCapitalConfig } from "@/lib/fpa/capital-config-access";
import { getExecutionAnalytics } from "@/lib/fpa/execution-analytics-access";
import { getGrowthAnalytics } from "@/lib/fpa/growth-analytics-access";
import { getManagementAdjustments } from "@/lib/fpa/management-adjustments-access";
import { getOutlookBundle } from "@/lib/fpa/outlook-access";
import { getMaPipelineEditable } from "@/lib/fpa/ma-pipeline-access";
import { getSpbpEditable } from "@/lib/fpa/spbp-access";
import type { ManagementReportBundle } from "@/lib/fpa/management-types";
import {
  buildDerivedScoreboardConfig,
  getScoreboardConfig,
  mergeScoreboardSource,
  resolveScoreboardView,
} from "@/lib/execution/scoreboard-access";
import { getStratDiffs } from "@/lib/data/versions-data";
import { computeRobustOverall } from "@/lib/stratos/robust-score";
import {
  demoTensions, demoMaturityPoints, demoCommitments,
  type TensionItem, type ExecutionMaturityPoint, type CommitmentRecord,
} from "@/lib/execution/tension-analysis";
import {
  demoMarketResponses, demoCompetitivePositions,
  type MarketEvidence, type CompetitivePosition,
} from "@/lib/execution/market-response";
import type {
  CapStackPeriod,
  FpaSummary,
  HealthAssertion,
  InvestmentCase,
  RobustnessDimensions,
  StrategicDiagnosis,
} from "@/lib/types/stratos";
import {
  DEFAULT_GROUP_ORG_UNIT_ID,
  DEFAULT_HORIZON_END,
  DEFAULT_HORIZON_START,
} from "@/lib/data/strategic-plan-data";

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
  if (rows.length === 0) return [];
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
  const period = await getActivePeriod();
  const row = await prisma.fpaPeriod.findFirst({
    where: { period, scope: "company" },
  });
  const cash = await prisma.cashPosition.findFirst({
    where: { period },
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
    where: { period: await getActivePeriod() },
  });
  if (!row) return demo.capStack;
  const byHorizon = row.byHorizonJson as Record<"H1" | "H2" | "H3", number>;
  const byBrand = (row.byBrandJson ?? {}) as Record<string, number>;
  const byType = (row.byTypeJson ?? {}) as Record<string, number>;
  return {
    period: row.period,
    capexBudget: Number(row.capexBudget),
    capexActual: Number(row.capexSpent),
    capexForecast: Number(row.capexCommitted),
    byHorizon,
    byBrand,
    byType,
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
  await requireDbAvailable();
  const { getCommandDecisionsConfig, getCommandTimelineConfig } = await import("@/lib/command/decisions-access");
  const { buildStrategicTimeline } = await import("@/lib/command/timeline");
  const { buildDecisionItems } = await import("@/lib/panorama/scr");
  const { getSnapshotList } = await import("@/lib/data/versions-data");

  const [diagnosis, fpa, assertions, source, spbpScenarios, capStack, investmentCases, bscLights, bscCards, robust, managementReport, stratDiffs, snapshots, decisionsConfig, timelineConfig] =
    await Promise.all([
      getDiagnosis(),
      getFpaSummary(),
      getActiveHealthAssertions(),
      getDataSource(),
      getSpbpScenarios(),
      getCapStack(),
      getInvestmentCases(),
      entities.getBscLights(),
      entities.getBscCards(),
      getRobustScore(),
      getManagementReport(),
      getStratDiffs(),
      getSnapshotList(),
      getCommandDecisionsConfig(),
      getCommandTimelineConfig(),
    ]);

  const base = {
    source,
    diagnosis,
    fpa,
    managementReport,
    assertions,
    bscLights,
    bscCards,
    robustScore: robust,
    robustOverall: computeRobustOverall(robust),
    stratDiffs,
    spbpScenarios,
    capStack,
    investmentCases,
  };

  const derivedDecisions = buildDecisionItems({
    ...base,
    decisions: [],
    derivedDecisions: [],
    decisionsSource: "derived",
    timeline: [],
    derivedTimeline: [],
    timelineSource: "derived",
  });
  const derivedTimeline = buildStrategicTimeline(snapshots, await getActivePeriod());
  return {
    ...base,
    decisions: decisionsConfig.decisions ?? derivedDecisions,
    derivedDecisions,
    decisionsSource: decisionsConfig.source,
    timeline: timelineConfig.milestones ?? derivedTimeline,
    derivedTimeline,
    timelineSource: timelineConfig.source,
  };
}

/** Strategy page bundle */
export async function getStrategyBundle() {
  await requireDbAvailable();
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
    growthAnalytics,
    fpa,
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
    getGrowthAnalytics(),
    getFpaSummary(),
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
    aarrrFunnel: growthAnalytics.aarrrFunnel,
    kellerBrandLayers: growthAnalytics.kellerBrandLayers,
    growthAnalyticsSource: growthAnalytics.source,
    fpa,
  };
}

/** Finance page bundle */
export async function getFinanceBundle() {
  await requireDbAvailable();
  const [fpa, capStack, investmentCases, spbpBundle, maBundle, source, managementReport, managementAdj, outlook, capitalConfig] =
    await Promise.all([
      getFpaSummary(),
      getCapStack(),
      getInvestmentCases(),
      getSpbpEditable(),
      getMaPipelineEditable(),
      getDataSource(),
      getManagementReport(),
      getManagementAdjustments(),
      getOutlookBundle(),
      getCapitalConfig(),
    ]);
  return {
    source,
    fpa,
    managementReport,
    managementMarginBridgeSource: managementAdj.marginBridgeSource,
    managementStatementsSource: managementAdj.statementsSource,
    capStack,
    capacity: await entities.getCapacity(),
    investmentCases,
    fiveYearForecast: outlook.fiveYearForecast,
    sensitivityDrivers: outlook.sensitivityDrivers,
    outlookSource: outlook.source,
    spbpScenarios: spbpBundle.scenarios,
    spbpSource: spbpBundle.source,
    maPipeline: maBundle.items,
    maSource: maBundle.source,
    realOptions: capitalConfig.realOptions,
    postInvestDeviations: capitalConfig.postInvestDeviations,
    capitalConfigSource: capitalConfig.source,
  };
}

export async function getManagementReport(): Promise<ManagementReportBundle> {
  const fpa = await getFpaSummary();
  const base = buildManagementReport(fpa, await getActivePeriod());
  const adj = await getManagementAdjustments();
  return {
    ...base,
    marginBridge: adj.marginBridge ?? base.marginBridge,
    incomeStatement: adj.statements?.incomeStatement ?? base.incomeStatement,
    balanceSheet: adj.statements?.balanceSheet ?? base.balanceSheet,
    cashFlowStatement: adj.statements?.cashFlowStatement ?? base.cashFlowStatement,
  };
}

/** Execution page bundle */
export async function getExecutionBundle() {
  await requireDbAvailable();
  const [
    diagnosis,
    techSignals,
    source,
    projects,
    assumptions,
    leadingKrs,
    allKrs,
    objectives,
    scoreboardStored,
    tensions,
    maturityPoints,
    commitments,
    marketResponses,
    competitivePositions,
    reportSignals,
    executionAnalytics,
  ] = await Promise.all([
    getDiagnosis(),
    getTechSignals(),
    getDataSource(),
    entities.getProjects(),
    entities.getAssumptions(),
    entities.getLeadingKeyResults(),
    entities.getAllKeyResults(),
    entities.getObjectives(),
    getScoreboardConfig(),
    getExecutionTensions(),
    getExecutionMaturity(),
    getCommitmentRecords(),
    getMarketEvidence(),
    getCompetitivePositions(),
    getReportDerivedSignals(),
    getExecutionAnalytics(),
  ]);
  const scoreboardConfig =
    scoreboardStored.config ?? buildDerivedScoreboardConfig(leadingKrs);
  const scoreboard = mergeScoreboardSource(
    resolveScoreboardView(scoreboardConfig, {
      diagnosis,
      objectives,
      allKrs,
      derivedLeadingKrs: leadingKrs,
    }),
    scoreboardStored.source,
  );
  return {
    source,
    diagnosis,
    leadingKrs,
    allKrs,
    objectives,
    scoreboard,
    scoreboardConfigSource: scoreboardStored.source,
    scoreboardConfig,
    horizonBubbles: executionAnalytics.horizonBubbles,
    projects,
    assumptions,
    techSignals,
    riceItems: executionAnalytics.riceItems,
    trlRadar: executionAnalytics.trlRadar,
    executionAnalyticsSource: executionAnalytics.source,
    tensions,
    maturityPoints,
    commitments,
    marketResponses,
    competitivePositions,
    reportSignals,
  };
}

// ── Execution layer (DB-backed, demo fallback) ───────────────────────────────

export async function getExecutionTensions(): Promise<TensionItem[]> {
  if (!(await dbAvailable())) return demoTensions;
  const rows = await prisma.executionTension.findMany({ where: { period: await getActivePeriod() }, orderBy: { createdAt: "asc" } });
  if (rows.length === 0) return demoTensions;
  return rows.map((r) => ({
    id: r.id, projectCode: r.projectCode, projectName: r.projectName,
    tensionType: r.tensionType, signal: r.signal, diagnosis: r.diagnosis,
    recommendation: r.recommendation, severity: r.severity,
    linkedAssumptionCode: r.linkedAssumptionCode ?? undefined,
    linkedKr: r.linkedKr ?? undefined,
  }));
}

export async function getExecutionMaturity(): Promise<ExecutionMaturityPoint[]> {
  if (!(await dbAvailable())) return demoMaturityPoints;
  const rows = await prisma.executionMaturity.findMany({ where: { period: await getActivePeriod() }, orderBy: { updatedAt: "asc" } });
  if (rows.length === 0) return demoMaturityPoints;
  return rows.map((r) => ({
    projectCode: r.projectCode, projectName: r.projectName, owner: r.owner,
    milestoneOnTimeRate: Number(r.milestoneOnTimeRate),
    assumptionHitRate: Number(r.assumptionHitRate),
    responseLatencyDays: r.responseLatencyDays,
    budgetTotal: Number(r.budgetTotal),
    tensionType: r.tensionType, horizon: r.horizon,
  }));
}

export async function getCommitmentRecords(): Promise<CommitmentRecord[]> {
  if (!(await dbAvailable())) return demoCommitments;
  const rows = await prisma.commitment.findMany({ orderBy: { deadline: "asc" } });
  if (rows.length === 0) return demoCommitments;
  const today = new Date();
  return rows.map((r) => {
    const overdue = r.status !== "completed" && r.deadline < today;
    const daysOverdue = overdue ? Math.floor((today.getTime() - r.deadline.getTime()) / 86400000) : undefined;
    return {
      id: r.id, owner: r.ownerName ?? r.promiseTo, department: r.promiseTo,
      content: r.content, deadline: r.deadline.toISOString().slice(0, 10),
      status: overdue ? "overdue" : (r.status as CommitmentRecord["status"]),
      daysOverdue,
      linkedProjectCode: r.linkedProjectCode ?? undefined,
      linkedAssumptionCode: r.linkedAssumptionCode ?? undefined,
    };
  });
}

export async function getMarketEvidence(): Promise<MarketEvidence[]> {
  if (!(await dbAvailable())) return demoMarketResponses;
  const rows = await prisma.marketEvidence.findMany({ where: { period: await getActivePeriod() }, orderBy: { createdAt: "asc" } });
  if (rows.length === 0) return demoMarketResponses;
  return rows.map((r) => ({
    id: r.id, actionLabel: r.actionLabel, actionCode: r.actionCode ?? undefined,
    linkedAssumptionCode: r.linkedAssumptionCode ?? undefined,
    evidenceText: r.evidenceText, evidenceSource: r.evidenceSource,
    recordedBy: r.recordedBy, recordedAt: r.recordedAt ? r.recordedAt.toISOString().slice(0, 10) : null,
    verdict: r.verdict, verdictNote: r.verdictNote,
  }));
}

export async function getCompetitivePositions(): Promise<CompetitivePosition[]> {
  if (!(await dbAvailable())) return demoCompetitivePositions;
  const rows = await prisma.competitivePosition.findMany({ where: { period: await getActivePeriod() }, orderBy: { createdAt: "asc" } });
  if (rows.length === 0) return demoCompetitivePositions;
  return rows.map((r) => ({
    id: r.id, competitor: r.competitor, dimension: r.dimension,
    ourValue: r.ourValue, theirValue: r.theirValue,
    period: r.period, delta: r.delta,
    evidenceSource: r.evidenceSource, recordedBy: r.recordedBy,
    recordedAt: r.recordedAt ? r.recordedAt.toISOString().slice(0, 10) : null,
  }));
}

// ── Report-derived execution signals (approved reports → execution audit) ────

export interface ReportSignal {
  reportId: string;
  reportTitle: string;
  orgUnitName: string | null;
  period: string;
  reportType: string;
  kind: "assertion" | "pattern";
  severity: "low" | "medium" | "high";
  label: string;
  detail: string;
  uploadedAt: string;
}

/**
 * 已存档（APPROVED）报告解析结果反哺执行审计：
 * - assertionTriggers → 高危信号（如现金 runway 触发）
 * - §8 战略模式（emergent/serendipitous）→ 涌现型机会/风险信号
 * 仅消费经人工确认存档的报告，保证审计输入可信。
 */
export async function getReportDerivedSignals(): Promise<ReportSignal[]> {
  if (!(await dbAvailable())) return [];
  const rows = await prisma.report.findMany({
    where: { approvalStatus: "APPROVED", NOT: { parsedJson: { equals: Prisma.DbNull } } },
    include: { orgUnit: { select: { name: true } } },
    orderBy: { uploadedAt: "desc" },
    take: 50,
  });

  const signals: ReportSignal[] = [];
  for (const r of rows) {
    const parsed = r.parsedJson as {
      assertionTriggers?: string[];
      patterns?: Array<{ title: string; formationType: string }>;
    } | null;
    if (!parsed) continue;

    const base = {
      reportId: r.id,
      reportTitle: r.title,
      orgUnitName: r.orgUnit?.name ?? null,
      period: r.period,
      reportType: r.reportType as string,
      uploadedAt: r.uploadedAt.toISOString().slice(0, 10),
    };

    for (const trigger of parsed.assertionTriggers ?? []) {
      signals.push({
        ...base,
        kind: "assertion",
        severity: "high",
        label: "执行红线触发",
        detail: trigger,
      });
    }
    for (const pat of parsed.patterns ?? []) {
      signals.push({
        ...base,
        kind: "pattern",
        severity: pat.formationType === "emergent" ? "medium" : "low",
        label: pat.formationType === "emergent" ? "涌现型战略信号" : "意外机会信号",
        detail: pat.title,
      });
    }
  }
  return signals;
}

// ── Ops health metrics (DB-backed, generator fallback) ───────────────────────

export async function getOpsHealthSeries(): Promise<import("@/lib/health/ops-metrics").MetricSeries[]> {
  const { buildSeriesFromActuals, getAllSeries } = await import("@/lib/health/ops-metrics");
  if (!(await dbAvailable())) return getAllSeries();
  const rows = await prisma.opsMetricActual.findMany();
  if (rows.length === 0) return getAllSeries();
  const byMetric = new Map<string, { month: string; actual: number | null; planned: number }[]>();
  for (const r of rows) {
    const arr = byMetric.get(r.metricId) ?? [];
    arr.push({ month: r.month, actual: r.actual != null ? Number(r.actual) : null, planned: Number(r.planned) });
    byMetric.set(r.metricId, arr);
  }
  return buildSeriesFromActuals(byMetric);
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
  const rows = await prisma.spbpScenario.findMany({ where: { period: await getActivePeriod() } });
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
    where: { period: await getActivePeriod() },
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

export async function getReports(orgScope?: string[] | null): Promise<ReportListItem[]> {
  const scopeFilter =
    orgScope != null && orgScope.length > 0 ? { orgUnitId: { in: orgScope } } : {};

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
  const rows = await prisma.report.findMany({
    where: scopeFilter,
    orderBy: { uploadedAt: "desc" },
    take: 20,
  });
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
  await requireDbAvailable();
  const { getBscConfig } = await import("@/lib/fpa/bsc-config-access");
  const [source, fpa, bscLights, bscConfig, healthOverview, robustScore, bscCards] = await Promise.all([
    getDataSource(),
    getFpaSummary(),
    entities.getBscLights(),
    getBscConfig(),
    entities.getHealthOverview(),
    getRobustScore(),
    entities.getBscCards(),
  ]);
  return {
    source,
    fpa,
    bscLights,
    bscCards,
    bscConfigSource: bscConfig.source,
    healthOverview,
    robustScore,
    robustOverall: computeRobustOverall(robustScore),
  };
}

/** Decode page bundle */
export async function getDecodeBundle() {
  const { getDecodeBsc, getDecodeHoshin } = await import("@/lib/decode/data-access");
  const { getFeedbackLoops } = await import("@/lib/feedback/data-access");
  const [source, feedback, bsc, hoshin] = await Promise.all([
    getDataSource(),
    getFeedbackLoops(),
    getDecodeBsc(),
    getDecodeHoshin(),
  ]);
  const dataSource =
    bsc.source === "database" || hoshin.source === "database" || feedback.source === "database"
      ? "database"
      : source;
  return {
    source: dataSource,
    loops: feedback.loops,
    bsc: bsc.rows,
    hoshinQuadrants: hoshin.quadrants,
    hoshinFlat: hoshin.flat,
  };
}

export interface RehearsalStrategySlide {
  id: string;
  eyebrow: string;
  title: string;
  lead?: string;
  bullets: string[];
  metrics?: Array<{ label: string; value: string; note?: string }>;
  footer?: string;
}

function trimText(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

function formatPlanAmount(value: unknown): string | null {
  if (value == null) return null;
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  if (Math.abs(num) >= 10000) return `${(num / 10000).toFixed(1)}亿`;
  return `${Math.round(num).toLocaleString("zh-CN")}万`;
}

function formatPlanPercent(value: unknown): string | null {
  if (value == null) return null;
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return `${Math.round(num * 100)}%`;
}

function compact(values: Array<string | null | undefined>, limit = 4): string[] {
  return values.map(trimText).filter(Boolean).slice(0, limit);
}

async function getRehearsalStrategySlides(): Promise<RehearsalStrategySlide[]> {
  if (!(await dbAvailable())) return [];

  const plan = await prisma.strategicPlan.findFirst({
    where: {
      orgUnitId: DEFAULT_GROUP_ORG_UNIT_ID,
      horizonStart: DEFAULT_HORIZON_START,
      horizonEnd: DEFAULT_HORIZON_END,
    },
    include: {
      objectives: {
        include: { keyResults: { orderBy: { sortOrder: "asc" } } },
        orderBy: { sortOrder: "asc" },
      },
      milestones: { orderBy: [{ sortOrder: "asc" }, { year: "asc" }] },
      premises: { orderBy: [{ sortOrder: "asc" }, { code: "asc" }] },
      assumptions: true,
      initiatives: { orderBy: { sortOrder: "asc" } },
      swotItems: { orderBy: { sortOrder: "asc" } },
      marketInsights: { orderBy: { sortOrder: "asc" } },
      actionItems: { orderBy: { sortOrder: "asc" } },
      budgetItems: { orderBy: { sortOrder: "asc" } },
      roadmapItems: { orderBy: { sortOrder: "asc" } },
      channelPlans: { orderBy: { sortOrder: "asc" } },
      customerPlans: { orderBy: { sortOrder: "asc" } },
      productQuarterly: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!plan) return [];

  const targetMetrics = [
    plan.targetYear ? { label: "目标年", value: String(plan.targetYear) } : null,
    formatPlanAmount(plan.revenueTarget)
      ? { label: "收入目标", value: formatPlanAmount(plan.revenueTarget)! }
      : null,
    formatPlanPercent(plan.profitMarginTarget)
      ? { label: "利润率", value: formatPlanPercent(plan.profitMarginTarget)! }
      : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  const slides: RehearsalStrategySlide[] = [];

  slides.push({
    id: "strategy-intent",
    eyebrow: "战略输入 · 方向",
    title: trimText(plan.northStar) || "战略北极星",
    lead: trimText(plan.intent) || "尚未填写战略意图，请先在 /strategy/input 完成输入。",
    bullets: compact([
      plan.marketPositionDesc ? `市场地位：${plan.marketPositionDesc}` : null,
      plan.geographyDesc ? `区域覆盖：${plan.geographyDesc}` : null,
      plan.brandDesc ? `品牌格局：${plan.brandDesc}` : null,
    ]),
    metrics: targetMetrics,
    footer: `来源 /strategy/input · ${plan.horizonStart}-${plan.horizonEnd} · ${plan.status}`,
  });

  const objectiveBullets = plan.objectives.flatMap((o) => {
    const krs = o.keyResults
      .map((kr) => [kr.keyResult, kr.target].filter(Boolean).join(" / "))
      .filter(Boolean)
      .slice(0, 2);
    return [
      trimText(o.objective),
      ...krs.map((kr) => `KR：${kr}`),
      o.mustNotFail ? `不可失败：${o.mustNotFail}` : null,
    ];
  });
  if (objectiveBullets.some(Boolean)) {
    slides.push({
      id: "strategy-objectives",
      eyebrow: "战略输入 · BSC / OKR",
      title: "战略目标与关键结果",
      bullets: compact(objectiveBullets, 8),
      footer: `${plan.objectives.length} 个目标 · ${plan.objectives.reduce((sum, o) => sum + o.keyResults.length, 0)} 个 KR`,
    });
  }

  const marketBullets = compact(
    plan.marketInsights.map((m) =>
      [m.title, m.dataPoint, m.content].map(trimText).filter(Boolean).join(" · "),
    ),
    5,
  );
  const swotBullets = compact(
    plan.swotItems.map((s) => `${s.quadrant.toUpperCase()}：${s.content}`),
    6,
  );
  if (marketBullets.length || swotBullets.length) {
    slides.push({
      id: "strategy-market",
      eyebrow: "战略输入 · 市场判断",
      title: "市场洞察与 SWOT",
      bullets: [...marketBullets, ...swotBullets].slice(0, 8),
      footer: "用于战略会开场对齐外部事实与内部能力判断",
    });
  }

  const initiativeBullets = compact(
    plan.initiatives.map((i) =>
      [
        trimText(i.title),
        i.ownerName ? `Owner ${i.ownerName}` : null,
        i.okrKeyResult ? `KR ${i.okrKeyResult}` : null,
        i.q3Milestone ? `Q3 ${i.q3Milestone}` : null,
      ]
        .filter(Boolean)
        .join(" · "),
    ),
    6,
  );
  if (initiativeBullets.length) {
    slides.push({
      id: "strategy-initiatives",
      eyebrow: "战略输入 · 关键举措",
      title: "必须打赢的行动",
      bullets: initiativeBullets,
      footer: "每项举措需在彩排中确认负责人、里程碑与验收标准",
    });
  }

  const roadmapBullets = compact(
    plan.roadmapItems.map((r) =>
      `${r.track} · ${r.title} · ${r.startYear}Q${r.startQ}-${r.endYear}Q${r.endQ}${
        r.milestone ? ` · ${r.milestone}` : ""
      }`,
    ),
    6,
  );
  const milestoneMetrics = plan.milestones.slice(0, 3).map((m) => ({
    label: String(m.year),
    value: m.label,
    note: formatPlanAmount(m.revenueTarget) ?? undefined,
  }));
  if (roadmapBullets.length || milestoneMetrics.length) {
    slides.push({
      id: "strategy-roadmap",
      eyebrow: "战略输入 · 路线图",
      title: "年度路径与里程碑",
      bullets: roadmapBullets,
      metrics: milestoneMetrics,
      footer: "用于投屏确认节奏、依赖与阶段性成果",
    });
  }

  const executionBullets = compact(
    plan.actionItems.map((a) =>
      [
        `${a.year}Q${a.quarter}`,
        trimText(a.action),
        a.ownerName ? `Owner ${a.ownerName}` : null,
        a.acceptanceCriteria ? `验收 ${a.acceptanceCriteria}` : null,
      ]
        .filter(Boolean)
        .join(" · "),
    ),
    6,
  );
  if (executionBullets.length) {
    slides.push({
      id: "strategy-execution",
      eyebrow: "战略输入 · 年度作战计划",
      title: "下一步执行闭环",
      bullets: executionBullets,
      footer: "会后进入承诺、复盘与执行看板",
    });
  }

  const budgetBullets = compact(
    plan.budgetItems.map((b) =>
      [
        b.category,
        trimText(b.description),
        b.totalAmount ? `合计 ${b.totalAmount}` : null,
        b.roiEstimate ? `ROI ${b.roiEstimate}` : null,
      ]
        .filter(Boolean)
        .join(" · "),
    ),
    5,
  );
  const premiseBullets = compact(
    [
      ...plan.premises.map((p) => `${p.code}：${p.premise} · 信心 ${p.confidence}% / 脆弱 ${p.fragility}%`),
      ...plan.assumptions.map((a) => `${a.critical ? "关键假设" : "假设"}：${a.assumption}`),
    ],
    5,
  );
  if (budgetBullets.length || premiseBullets.length) {
    slides.push({
      id: "strategy-risks-resources",
      eyebrow: "战略输入 · 资源与假设",
      title: "资源投入和前提条件",
      bullets: [...budgetBullets, ...premiseBullets].slice(0, 8),
      footer: "投屏讨论重点：哪些资源现在承诺，哪些假设必须监控",
    });
  }

  const productBullets = compact(
    plan.productQuarterly.map((p) =>
      [
        trimText(p.productName),
        p.annualRevenue ? `年收入 ${formatPlanAmount(p.annualRevenue)}` : null,
        p.note,
      ]
        .filter(Boolean)
        .join(" · "),
    ),
    4,
  );
  const channelBullets = compact(
    plan.channelPlans.map((c) =>
      [
        trimText(c.channelType),
        c.targetState,
        c.revenueTarget ? `目标 ${formatPlanAmount(c.revenueTarget)}` : null,
      ]
        .filter(Boolean)
        .join(" · "),
    ),
    3,
  );
  const customerBullets = compact(
    plan.customerPlans.map((c) =>
      [
        trimText(c.customerSegment),
        c.targetCount != null ? `目标 ${c.targetCount} 家` : null,
        c.acquisitionStrategy,
      ]
        .filter(Boolean)
        .join(" · "),
    ),
    3,
  );
  if (productBullets.length || channelBullets.length || customerBullets.length) {
    slides.push({
      id: "strategy-business-plan",
      eyebrow: "战略输入 · 业务专题",
      title: "产品、渠道与客户打法",
      bullets: [...productBullets, ...channelBullets, ...customerBullets].slice(0, 8),
      footer: "适合 BU 投屏汇报与质询",
    });
  }

  return slides;
}

/** Q3 rehearsal live context */
export async function getRehearsalBundle() {
  const [deck, , versions, strategySlides] = await Promise.all([
    getCommandDeckBundle(),
    getHealthBundle(),
    import("@/lib/data/versions-data").then((m) => m.getVersionsBundle()),
    getRehearsalStrategySlides(),
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
    strategySlides,
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
