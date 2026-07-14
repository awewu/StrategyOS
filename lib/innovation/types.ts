export type EvidenceLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type LifecycleStage = "introduction" | "growth" | "maturity" | "decline";

export type ProblemType =
  | "pmf_unvalidated"
  | "tech_immature"
  | "manufacturing_rampup"
  | "cost_pressure"
  | "channel_gtm"
  | "substitution_threat";

export type SourcingDecision = "build" | "buy" | "partner";

export type GateVerdict = "go" | "hold" | "kill";

export type AssumptionStatus = "pending" | "validated" | "failed";

export interface DFV {
  d: number;
  f: number;
  v: number;
}

export interface FeasibilityDimension {
  key: string;
  score: number;
  evidenceLevel: EvidenceLevel;
}

export type FAxisWeights = Record<string, number>;

export interface OdiInput {
  importance: number;
  satisfaction: number;
}

export interface DealEconomics {
  paybackYears: number;
  roic: number;
  wacc: number;
}

export interface ViabilityRef {
  targetPaybackYears: number;
  minRoicSpread: number;
}

export interface ArbitrageInput {
  dailyShiftedKwh: number;
  activeDays: number;
  priceSpread: number;
  roundTripEff: number;
}

export interface GateThresholds {
  maxPaybackYears: number;
  minRoicOverWacc: number;
  minScore: number;
  minEvidenceLevel: EvidenceLevel;
}

export interface KillerAssumption {
  code: string;
  status: AssumptionStatus;
}

export interface GateInput {
  scores: DFV;
  minEvidence: EvidenceLevel;
  thresholds: GateThresholds;
  economics: DealEconomics;
  killerAssumptions: KillerAssumption[];
}

export interface GateResult {
  verdict: GateVerdict;
  blockers: string[];
}

export interface CapabilityGap {
  capability: string;
  internalReadiness: number;
  windowMonths: number;
  buildMonths: number;
}

export interface SourcingOptions {
  readyThreshold: number;
}

export interface SourcingResult {
  capability: string;
  decision: SourcingDecision;
  reason: string;
}

export interface ProductLineProfile {
  lineId: string;
  name: string;
  lifecycleStage: LifecycleStage;
  dominantProblems: ProblemType[];
  fAxisWeights: FAxisWeights;
  gateThresholds: GateThresholds;
  evidenceBar: EvidenceLevel;
}
