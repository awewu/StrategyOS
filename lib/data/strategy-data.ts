/**
 * Unified data access — DB when available, demo fallback otherwise.
 */
import { Prisma } from "@prisma/client";
import { dbAvailable, prisma } from "@/lib/db";
import * as entities from "@/lib/data/entity-getters";
import * as demo from "@/lib/stratos-demo-data";
import { buildManagementReport } from "@/lib/fpa/management-report";
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
  const derivedTimeline = buildStrategicTimeline(snapshots);
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
  };
}

/** Finance page bundle */
export async function getFinanceBundle() {
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
  const base = buildManagementReport(fpa, demo.CURRENT_PERIOD);
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
  const rows = await prisma.executionTension.findMany({ where: { period: demo.CURRENT_PERIOD }, orderBy: { createdAt: "asc" } });
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
  const rows = await prisma.executionMaturity.findMany({ where: { period: demo.CURRENT_PERIOD }, orderBy: { updatedAt: "asc" } });
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
  const rows = await prisma.marketEvidence.findMany({ where: { period: demo.CURRENT_PERIOD }, orderBy: { createdAt: "asc" } });
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
  const rows = await prisma.competitivePosition.findMany({ where: { period: demo.CURRENT_PERIOD }, orderBy: { createdAt: "asc" } });
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

/** Q3 rehearsal live context */
export async function getRehearsalBundle() {
  const [deck, , versions] = await Promise.all([
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
