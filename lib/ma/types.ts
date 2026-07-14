import type { EvidenceLevel } from "@/lib/innovation/types";

export type DealType = "acquisition" | "merger" | "minority_investment" | "jv";

export type DealStage =
  | "sourcing"
  | "screening"
  | "dd"
  | "valuation"
  | "approval"
  | "integration"
  | "postclose";

export type DealVerdict = "go" | "hold" | "kill";

export type ValuationMethod = "dcf" | "comps" | "precedent";

export interface ValuationRange {
  method: ValuationMethod;
  low: number;
  base: number;
  high: number;
}

export interface FootballField {
  low: number;
  high: number;
  medianBase: number;
}

export interface SynergyItem {
  type: "revenue" | "cost";
  runRate: number;
  ramp: number[];
  oneTimeCost: number;
  evidenceLevel: EvidenceLevel;
}

export interface DealEconomicsInput {
  price: number;
  synergyNpvValue: number;
  roic?: number;
  wacc?: number;
  paybackYears?: number;
}

export interface DealEconomicsResult {
  synergyPctOfPrice: number;
  roicSpread: number | null;
}

export interface RequiredFlag {
  key: string;
  label: string;
}

export interface DealTypeThresholds {
  maxPaybackYears: number;
  minRoicOverWacc: number;
  maxSynergyPctOfPrice: number;
  minEvidenceLevel: EvidenceLevel;
}

export interface DealGateInput {
  economics: DealEconomicsResult & { paybackYears?: number };
  minEvidence: EvidenceLevel;
  thresholds: DealTypeThresholds;
  requiredFlags: RequiredFlag[];
  flags: Record<string, boolean>;
  openDealBreakers: string[];
  openConditions: string[];
  strict: boolean;
}

export interface DealGateResult {
  verdict: DealVerdict;
  blockers: string[];
  warnings: string[];
}
