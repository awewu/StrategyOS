import type {
  CapabilityGap,
  DFV,
  EvidenceLevel,
  FAxisWeights,
  FeasibilityDimension,
  GateResult,
  GateThresholds,
  OdiInput,
  SourcingResult,
} from "./types";

export const STAGE_ORDER = ["discovery", "scoping", "business_case", "development", "testing", "launch"] as const;
export type StageGate = (typeof STAGE_ORDER)[number];

export const STAGE_LABEL: Record<StageGate, string> = {
  discovery: "Discovery",
  scoping: "Scoping",
  business_case: "Business Case",
  development: "Development",
  testing: "Testing",
  launch: "Launch",
};

export const DEFAULT_GATE_THRESHOLDS: GateThresholds = {
  maxPaybackYears: 3,
  minRoicOverWacc: 0,
  minScore: 40,
  minEvidenceLevel: 4,
};

export interface EvidenceView {
  id: string;
  level: EvidenceLevel;
  /** 接地后的有效级别：无 artifactRef 时封顶 L2 */
  effectiveLevel: EvidenceLevel;
  source: string;
  artifactRef: string | null;
  note: string | null;
  stale: boolean;
}

export interface ClaimView {
  id: string;
  axis: string;
  claim: string;
  warrant: string | null;
  rebuttal: string | null;
  strength: EvidenceLevel;
  evidence: EvidenceView[];
}

export interface AssumptionView {
  id: string;
  code: string;
  statement: string;
  status: string;
  testPlan: string | null;
}

export interface EconomicsInput {
  costPremium?: number;
  annualSaving?: number;
  dailyShiftedKwh?: number;
  activeDays?: number;
  priceSpread?: number;
  roundTripEff?: number;
  paybackYears?: number;
  roic?: number;
  wacc?: number;
}

export interface BetView {
  id: string;
  lineId: string;
  title: string;
  horizon: string;
  stageGate: StageGate;
  nextCommitAmount: number | null;
  abandonRight: boolean;
  wtpFactor: number;
  odi: OdiInput[];
  feasibilityDims: FeasibilityDimension[];
  capabilityGaps: CapabilityGap[];
  economics: EconomicsInput;
  paybackYears: number | null;
  scores: DFV;
  minEvidence: EvidenceLevel;
  gate: GateResult;
  sourcing: SourcingResult[];
  claims: ClaimView[];
  assumptions: AssumptionView[];
}

export interface LineView {
  id: string;
  name: string;
  lifecycleStage: string;
  dominantProblems: string[];
  fAxisWeights: FAxisWeights;
  gateThresholds: GateThresholds;
  evidenceBar: number;
  bets: BetView[];
}

export interface InnovationBundle {
  lines: LineView[];
}
