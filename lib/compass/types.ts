export interface NorthStar {
  id: string;
  mission: string;
  vision: string;
  targetYear: number;
  revenueTarget: number;
  profitMarginTarget: number;
  marketPositionDesc: string | null;
  geographyDesc: string | null;
  brandDesc: string | null;
}

export interface CompassMilestone {
  id: string;
  year: number;
  label: string;
  revenueTarget: number | null;
  profitMarginTarget: number | null;
  keyConditions: string[];
  revenueActual: number | null;
  progressNote: string | null;
  riskScore: number | null;
  riskFactors: string[];
}

export interface PremiseAudit {
  id: string;
  code: string;
  premise: string;
  category: string;
  confidence: number;
  fragility: number;
  lastValidatedAt: string | null;
  validationNote: string | null;
  failSignal: string | null;
  signalSource: string | null;
  signalAt: string | null;
}

import type { BscDimensionRow } from "@/lib/decode/bsc-map";

export interface CompassBundle {
  northStar: NorthStar | null;
  milestones: CompassMilestone[];
  premises: PremiseAudit[];
  currentRevenue: number;
  currentMargin: number;
  /** StrategicPlan DB vs demo fallback */
  planSource?: "database" | "demo";
  /** Active plan id — milestones persist here */
  planId?: string;
  /** BSC rows derived from active StrategicPlan when present */
  planBsc?: BscDimensionRow[];
}
