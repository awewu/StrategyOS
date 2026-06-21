/** StratOS domain types — mirrors docs/OBJECT_MODEL.md */

export type TrafficLight = "green" | "yellow" | "red";
export type CynefinDomain = "clear" | "complicated" | "complex" | "chaotic";
export type BetGateStatus =
  | "draft"
  | "review"
  | "approved"
  | "rejected"
  | "killed"
  | "post_invest"
  | "deferred";
export type FpaToggle = "on" | "off" | "deferred";
export type Horizon = "H1" | "H2" | "H3";
export type BrandCode = "RUIMEI" | "HENGRE" | "RUUD" | "TECH_HOME";
export type StrategyFormationType =
  | "deliberate"
  | "emergent"
  | "unrealized"
  | "serendipitous";
export type DiffCategory =
  | "BSC_TARGET"
  | "OKR_REPLACE"
  | "PROJECT_MIGRATE"
  | "ASSUMPTION_FAILED"
  | "ASSUMPTION_NEW"
  | "DOCTRINE_BREACH"
  | "HEALTH_LIGHT"
  | "COMMITMENT_DROP"
  | "SATISFACTION_FAIL"
  | "RESOURCE_REALLOC"
  | "COMPETITOR_EVENT"
  | "INTENT_CHANGE"
  | "FPA_FORECAST"
  | "CASH_RUNWAY"
  | "EMERGENT_PATTERN"
  | "UNREALIZED"
  | "SERENDIPITOUS"
  | "DELIBERATE_RATE_DROP"
  | "IC_CHANGE"
  | "CAPSTACK_CHANGE"
  | "CAPACITY_GAP"
  | "IC_ROI_DEVIATION"
  | "ROADMAP_SLIP"
  | "PRODUCT_BET_CHANGE"
  | "COMP_GAP_CHANGE"
  | "PRODUCT_MIX_CHANGE"
  | "SEGMENT_PRIORITY"
  | "CHANNEL_CELL_CHANGE"
  | "COVERAGE_TARGET"
  | "LTV_CAC_DETERIORATION";

export type DiffSeverity = "info" | "warning" | "critical" | "high" | "medium";

export interface StrategicDiagnosis {
  id: string;
  period: string;
  challengeStatement: string;
  bottleneckType: "capability" | "market" | "organization" | "capital";
  crux: string;
  status: "draft" | "approved";
}

export interface BrandStrategyCard {
  brandCode: BrandCode;
  winningAspiration: string;
  whereToPlay: string;
  howToWin: string;
}

export interface InvestmentCase {
  id: string;
  code: string;
  title: string;
  type: string;
  horizon: Horizon;
  capexTotal: number;
  expectedIrr?: number;
  gateStatus: BetGateStatus;
  budgetTag: string;
  fpaToggle: FpaToggle;
}

export interface ProductBet {
  id: string;
  title: string;
  horizon: Horizon;
  gateStatus: BetGateStatus;
  budgetTag?: string;
  fpaToggle: FpaToggle;
}

export interface GtmBet {
  id: string;
  title: string;
  gateStatus: BetGateStatus;
  budgetTag?: string;
  fpaToggle: FpaToggle;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  cynefinDomain: CynefinDomain;
  horizon?: Horizon;
  progressPercent: number;
  status: "active" | "completed" | "paused";
  budgetTotal: number;
  budgetSpent: number;
  riskLevel: "none" | "low" | "medium" | "high";
  owner?: string;
}

export interface Assumption {
  id: string;
  code: string;
  content: string;
  cynefinDomain: CynefinDomain;
  result: "pending" | "validated" | "failed";
}

export interface KeyResult {
  id: string;
  title: string;
  budgetTag?: string;
  targetValue?: string;
  currentValue?: string;
  confidence?: number;
  isLeadingIndicator: boolean;
}

export interface HealthAssertion {
  id: string;
  assertionType: "runway" | "compliance" | "talent" | "brand";
  active: boolean;
  message: string;
  metricValue?: number;
  thresholdValue?: number;
  sourceReportId?: string;
  ceoExceptionNote?: string;
}

export interface CapStackPeriod {
  period: string;
  capexBudget: number;
  capexActual: number;
  capexForecast: number;
  byHorizon: Record<Horizon, number>;
  byBrand: Record<string, number>;
  byType: Record<string, number>;
  cashPeakMonth: string;
  cashPeakAmount: number;
  runwayAfterPeak: number;
}

export interface CapacitySnapshot {
  demandUnits: number;
  capacityUnits: number;
  gapUnits: number;
  utilizationPct: number;
  gapAction: "invest" | "outsource" | "defer_demand";
  linkedIcCode?: string;
}

export interface FpaSummary {
  revenueBudget: number;
  revenueActual: number;
  revenueForecast: number;
  profitBudget: number;
  profitActual: number;
  profitForecast: number;
  cashRunwayMonths: number;
}

export interface StrategyPattern {
  deliberateRealizationRate: number;
  emergentPatterns: Array<{ title: string; suggestDeliberate: boolean }>;
  unrealizedItems: Array<{ objectType: string; title: string }>;
  serendipitousItems: Array<{ title: string }>;
  learningPrompts: string[];
}

export interface SnapshotStatePayload {
  diagnosis?: StrategicDiagnosis;
  brandCards?: BrandStrategyCard[];
  investmentCases?: InvestmentCase[];
  productBets?: ProductBet[];
  gtmBets?: GtmBet[];
  projects?: Project[];
  assumptions?: Assumption[];
  keyResults?: KeyResult[];
  fpa?: FpaSummary;
  capStack?: CapStackPeriod;
  capacity?: CapacitySnapshot;
  strategyPattern?: StrategyPattern;
  healthAssertions?: HealthAssertion[];
}

export interface DiffRecord {
  category: DiffCategory;
  severity: DiffSeverity;
  title: string;
  detail?: string;
  formationType?: StrategyFormationType;
  beforeJson?: unknown;
  afterJson?: unknown;
}

export interface ReportPattern {
  formationType: StrategyFormationType;
  title: string;
  linkedOkr: string[];
  suggestDeliberate?: boolean;
  reportId: string;
}

/** R1–R6 dimension scores (0–100) */
export interface RobustnessDimensions {
  direction: number;
  logic: number;
  execution: number;
  baseline: number;
  doctrine: number;
  learning: number;
}

export type MaDirection = "channel" | "tech" | "jv" | "brand";
export type MaStage = "watch" | "screen" | "dd" | "signed" | "integrating";

export interface MaPipelineItem {
  id: string;
  name: string;
  direction: MaDirection;
  stage: MaStage;
  synergyThesis: string;
  valuationRange: string;
  linkedAssumptionCodes: string[];
  integrationMilestone100d?: string;
}

export interface FpaYearRow {
  year: string;
  revenueBudget: number;
  revenueForecast: number;
  profitBudget: number;
  profitForecast: number;
  capexBudget: number;
}

export interface SensitivityDriver {
  id: string;
  label: string;
  baseValue: number;
  unit: string;
  lowDelta: number;
  highDelta: number;
  impactOnProfit: { low: number; high: number };
}

export interface Scenario {
  id: string;
  name: string;
  probability: number;
  drivers: string[];
  fpaImpact: { revenue: number; profit: number; runwayMonths: number };
  linkedAssumptionCodes: string[];
}

export type AarrrStage = "acquisition" | "activation" | "retention" | "revenue" | "referral";

export interface AarrrFunnelStage {
  stage: AarrrStage;
  label: string;
  count: number;
  conversionPct: number;
  benchmarkPct: number;
  leakNote?: string;
}

export interface KellerBrandLayer {
  layer: number;
  name: string;
  score: number;
  target: number;
  note?: string;
}

export type FeedbackLoopKind = "R" | "B" | "D";

export interface FeedbackLoop {
  id: string;
  kind: FeedbackLoopKind;
  label: string;
  chain: string;
  bscDimension: string;
  fpaLinked?: boolean;
}

export interface TechSignal {
  id: string;
  domain: "heat_pump" | "controls" | "channel_tech" | "efficiency";
  title: string;
  trl: number;
  source: string;
  horizon: Horizon;
  linkedProjectCode?: string;
  urgency: "watch" | "act" | "invest";
}

export interface RiceItem {
  id: string;
  initiative: string;
  reach: number;
  impact: number;
  confidence: number;
  effort: number;
  score: number;
  linkedVx?: string;
}

export interface TrlRadarPoint {
  domain: string;
  current: number;
  target: number;
  gapNote?: string;
}

export interface RealOptionTag {
  icCode: string;
  title: string;
  stageGate: string;
  abandonRight: boolean;
  nextCommitAmount: number;
  optionValueNote: string;
}

export interface PostInvestDeviation {
  icCode: string;
  title: string;
  approvedCapex: number;
  actualCapex: number;
  expectedIrr: number;
  actualIrr?: number;
  deviationPct: number;
  status: "on_track" | "watch" | "critical";
}
