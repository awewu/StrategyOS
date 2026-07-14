import type {
  DealEconomicsResult,
  DealGateResult,
  DealStage,
  DealType,
  DealTypeThresholds,
  FootballField,
  RequiredFlag,
  ValuationMethod,
} from "./types";

export const DEAL_STAGE_ORDER: DealStage[] = [
  "sourcing",
  "screening",
  "dd",
  "valuation",
  "approval",
  "integration",
  "postclose",
];

export const DEAL_STAGE_LABEL: Record<DealStage, string> = {
  sourcing: "寻源",
  screening: "筛选",
  dd: "尽调",
  valuation: "估值/结构",
  approval: "审批",
  integration: "整合",
  postclose: "投后",
};

export const DEAL_TYPE_LABEL: Record<DealType, string> = {
  acquisition: "收购",
  merger: "并购",
  minority_investment: "投资",
  jv: "合资",
};

export const DEFAULT_DEAL_THRESHOLDS: DealTypeThresholds = {
  maxPaybackYears: 6,
  minRoicOverWacc: 0,
  maxSynergyPctOfPrice: 0.5,
  minEvidenceLevel: 4,
};

export interface DealTypeProfileView {
  id: string;
  dealType: DealType;
  name: string;
  thresholds: DealTypeThresholds;
  requiredFlags: RequiredFlag[];
}

export interface ValuationView {
  id: string;
  method: ValuationMethod;
  low: number;
  base: number;
  high: number;
  note: string | null;
}

export interface SynergyView {
  id: string;
  type: "revenue" | "cost";
  title: string;
  runRate: number;
  ramp: number[];
  oneTimeCost: number;
  evidenceLevel: number;
}

export interface DdFindingView {
  id: string;
  workstream: string;
  finding: string;
  severity: string;
  dealBreaker: boolean;
  status: string;
}

export interface ConditionView {
  id: string;
  item: string;
  owner: string | null;
  dueDate: string | null;
  status: string;
}

export interface ScreeningRow {
  dimension: string;
  judgment: string;
  evidenceLevel: number;
}

export interface DealStructure {
  cashPct?: number;
  stockPct?: number;
  earnoutPct?: number;
  earnoutTerms?: string;
}

export interface DealEconomicsFields {
  roic?: number;
  wacc?: number;
  paybackYears?: number;
}

export interface DealView {
  id: string;
  name: string;
  dealType: DealType;
  direction: string;
  stage: DealStage;
  thesis: string;
  linkedCrux: string | null;
  dealLead: string | null;
  budgetTag: string | null;
  price: number | null;
  walkAwayPrice: number | null;
  discountRate: number;
  dealStructure: DealStructure;
  economicsInput: DealEconomicsFields;
  flags: Record<string, boolean>;
  screening: ScreeningRow[];
  valuations: ValuationView[];
  synergies: SynergyView[];
  findings: DdFindingView[];
  conditions: ConditionView[];
  // computed
  footballField: FootballField | null;
  synergyNpvValue: number;
  economics: DealEconomicsResult;
  minEvidence: number;
  gate: DealGateResult;
}

export interface MaBundle {
  profiles: DealTypeProfileView[];
  deals: DealView[];
}
