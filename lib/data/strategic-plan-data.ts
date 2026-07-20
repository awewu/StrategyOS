/**
 * Active StrategicPlan — single source for compass / input / decode BSC.
 */
import { dbAvailable, prisma } from "@/lib/db";
import { BSC_MAP, type BscDimensionRow } from "@/lib/decode/bsc-map";
import { BSC_DIM_ENUMS, BSC_ENUM_LABEL, toBscDimEnum, type BscDimEnum } from "@/lib/decode/bsc-dimensions";
import type { CompassMilestone, PremiseAudit } from "@/lib/compass/types";
import type { TrafficLight } from "@/lib/types/stratos";

export const DEFAULT_GROUP_ORG_UNIT_ID = "org-group-rhautt";
export const DEFAULT_HORIZON_START = 2026;
export const DEFAULT_HORIZON_END = 2028;

// 维度分类学统一自 @/lib/decode/bsc-dimensions（单一真相）。
const DIMENSION_ORDER = BSC_DIM_ENUMS;
type PlanDimension = BscDimEnum;
const DIM_LABEL = BSC_ENUM_LABEL;

export interface PlanKeyResultView {
  keyResult: string;
  target: string | null;
}

export interface PlanObjectiveView {
  dimension: PlanDimension;
  objective: string;
  keyResults: PlanKeyResultView[];
  mustNotFail: string | null;
  mustWinStatus: TrafficLight;
  notFailStatus: TrafficLight;
}

export interface PlanMilestoneView {
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

export interface PlanPremiseView {
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

export interface ActiveStrategicPlan {
  id: string;
  orgUnitId: string;
  intent: string | null;
  northStar: string | null;
  targetYear: number | null;
  revenueTarget: number | null;
  profitMarginTarget: number | null;
  marketPositionDesc: string | null;
  geographyDesc: string | null;
  brandDesc: string | null;
  status: string;
  objectives: PlanObjectiveView[];
  milestones: PlanMilestoneView[];
  premises: PlanPremiseView[];
  assumptions: Array<{ assumption: string; critical: boolean }>;
}

export function hasPlanContent(plan: ActiveStrategicPlan): boolean {
  return Boolean(
    plan.intent?.trim() ||
      plan.northStar?.trim() ||
      plan.objectives.some(
        (o) => o.objective.trim() || o.keyResults.some((k) => k.keyResult.trim()),
      ),
  );
}

function mapMilestone(row: {
  id: string;
  year: number;
  label: string;
  revenueTarget: unknown;
  profitMarginTarget: unknown;
  keyConditions: string[];
  revenueActual: unknown;
  progressNote: string | null;
  riskScore: number | null;
  riskFactors: string[];
}): PlanMilestoneView {
  return {
    id: row.id,
    year: row.year,
    label: row.label,
    revenueTarget: row.revenueTarget != null ? Number(row.revenueTarget) : null,
    profitMarginTarget: row.profitMarginTarget != null ? Number(row.profitMarginTarget) : null,
    keyConditions: row.keyConditions,
    revenueActual: row.revenueActual != null ? Number(row.revenueActual) : null,
    progressNote: row.progressNote,
    riskScore: row.riskScore,
    riskFactors: row.riskFactors,
  };
}

export function planPremisesToCompass(premises: PlanPremiseView[]): PremiseAudit[] {
  return premises.map((p) => ({ ...p }));
}

export function planMilestonesToCompass(milestones: PlanMilestoneView[]): CompassMilestone[] {
  return milestones.map((m) => ({ ...m }));
}

function mapPremise(row: {
  id: string;
  code: string;
  premise: string;
  category: string;
  confidence: number;
  fragility: number;
  lastValidatedAt: Date | null;
  validationNote: string | null;
  failSignal: string | null;
  signalSource: string | null;
  signalAt: Date | null;
}): PlanPremiseView {
  return {
    id: row.id,
    code: row.code,
    premise: row.premise,
    category: row.category,
    confidence: row.confidence,
    fragility: row.fragility,
    lastValidatedAt: row.lastValidatedAt?.toISOString().slice(0, 10) ?? null,
    validationNote: row.validationNote,
    failSignal: row.failSignal,
    signalSource: row.signalSource,
    signalAt: row.signalAt?.toISOString().slice(0, 10) ?? null,
  };
}

function mapPlan(row: {
  id: string;
  orgUnitId: string;
  intent: string | null;
  northStar: string | null;
  targetYear: number | null;
  revenueTarget: unknown;
  profitMarginTarget: unknown;
  marketPositionDesc: string | null;
  geographyDesc: string | null;
  brandDesc: string | null;
  status: string;
  objectives: Array<{
    dimension: string;
    objective: string;
    mustNotFail: string | null;
    mustWinStatus: TrafficLight;
    notFailStatus: TrafficLight;
    keyResults: Array<{ keyResult: string; target: string | null }>;
  }>;
  milestones: Array<{
    id: string;
    year: number;
    label: string;
    revenueTarget: unknown;
    profitMarginTarget: unknown;
    keyConditions: string[];
    revenueActual: unknown;
    progressNote: string | null;
    riskScore: number | null;
    riskFactors: string[];
  }>;
  premises: Array<{
    id: string;
    code: string;
    premise: string;
    category: string;
    confidence: number;
    fragility: number;
    lastValidatedAt: Date | null;
    validationNote: string | null;
    failSignal: string | null;
    signalSource: string | null;
    signalAt: Date | null;
  }>;
  assumptions: Array<{ assumption: string; critical: boolean }>;
}): ActiveStrategicPlan {
  return {
    id: row.id,
    orgUnitId: row.orgUnitId,
    intent: row.intent,
    northStar: row.northStar,
    targetYear: row.targetYear,
    revenueTarget: row.revenueTarget != null ? Number(row.revenueTarget) : null,
    profitMarginTarget: row.profitMarginTarget != null ? Number(row.profitMarginTarget) : null,
    marketPositionDesc: row.marketPositionDesc,
    geographyDesc: row.geographyDesc,
    brandDesc: row.brandDesc,
    status: row.status,
    objectives: row.objectives.map((o) => ({
      dimension: o.dimension as PlanDimension,
      objective: o.objective,
      mustNotFail: o.mustNotFail,
      mustWinStatus: o.mustWinStatus,
      notFailStatus: o.notFailStatus,
      keyResults: o.keyResults.map((k) => ({
        keyResult: k.keyResult,
        target: k.target,
      })),
    })),
    milestones: row.milestones.map(mapMilestone),
    premises: row.premises.map(mapPremise),
    assumptions: row.assumptions.map((a) => ({
      assumption: a.assumption,
      critical: a.critical,
    })),
  };
}

const planInclude = {
  objectives: {
    include: { keyResults: { orderBy: { sortOrder: "asc" as const } } },
    orderBy: { sortOrder: "asc" as const },
  },
  milestones: { orderBy: [{ sortOrder: "asc" as const }, { year: "asc" as const }] },
  premises: { orderBy: [{ sortOrder: "asc" as const }, { code: "asc" as const }] },
  assumptions: true,
};

export async function getActiveStrategicPlan(
  orgUnitId = DEFAULT_GROUP_ORG_UNIT_ID,
  horizonStart = DEFAULT_HORIZON_START,
  horizonEnd = DEFAULT_HORIZON_END,
): Promise<{ plan: ActiveStrategicPlan | null; source: "database" | "demo" }> {
  if (!(await dbAvailable())) {
    return { plan: null, source: "demo" };
  }

  const row = await prisma.strategicPlan.findFirst({
    where: { orgUnitId, horizonStart, horizonEnd },
    include: planInclude,
  });

  if (!row) {
    return { plan: null, source: "demo" };
  }

  return { plan: mapPlan(row), source: "database" };
}

function defaultRowForDimension(dim: PlanDimension, index: number): BscDimensionRow {
  const label = DIM_LABEL[dim];
  const fallback = BSC_MAP.find((r) => r.dim === label) ?? BSC_MAP[index] ?? BSC_MAP[0];
  return { ...fallback, dim: label };
}

type DecodeOverlay = Partial<Pick<BscDimensionRow, "mustNotFail" | "mustWinStatus" | "notFailStatus">>;

/** Plan objectives → decode BSC rows; overlay fills gaps from legacy decode_bsc_rows. */
export function planObjectivesToBscRows(
  objectives: PlanObjectiveView[],
  overlayByDim?: Record<string, DecodeOverlay>,
): BscDimensionRow[] {
  return DIMENSION_ORDER.map((dim, index) => {
    const obj = objectives.find((o) => o.dimension === dim);
    const defaultRow = defaultRowForDimension(dim, index);
    const overlay = overlayByDim?.[DIM_LABEL[dim]];

    if (!obj?.objective.trim()) {
      if (overlay?.mustNotFail) {
        return {
          ...defaultRow,
          mustNotFail: overlay.mustNotFail,
          mustWinStatus: overlay.mustWinStatus ?? defaultRow.mustWinStatus,
          notFailStatus: overlay.notFailStatus ?? defaultRow.notFailStatus,
        };
      }
      return defaultRow;
    }

    const krs = obj.keyResults.map((k) => k.keyResult.trim()).filter(Boolean);
    const mustNotFail =
      obj.mustNotFail?.trim() ||
      overlay?.mustNotFail?.trim() ||
      defaultRow.mustNotFail;

    return {
      dim: DIM_LABEL[dim],
      objective: obj.objective.trim(),
      mustWin: krs[0] ?? defaultRow.mustWin,
      operating: krs.length > 1 ? krs.slice(1) : defaultRow.operating,
      mustNotFail,
      mustWinStatus: obj.mustWinStatus ?? overlay?.mustWinStatus ?? defaultRow.mustWinStatus,
      notFailStatus: obj.notFailStatus ?? overlay?.notFailStatus ?? defaultRow.notFailStatus,
    };
  });
}

export function bscRowsToPlanObjectives(rows: BscDimensionRow[]): PlanObjectiveView[] {
  return rows.map((row) => {
    const dimension = toBscDimEnum(row.dim.trim()) ?? "FINANCIAL";
    const keyResults: PlanKeyResultView[] = [];
    if (row.mustWin.trim()) {
      keyResults.push({ keyResult: row.mustWin.trim(), target: null });
    }
    for (const kr of row.operating) {
      if (kr.trim()) {
        keyResults.push({ keyResult: kr.trim(), target: null });
      }
    }
    return {
      dimension,
      objective: row.objective.trim(),
      keyResults,
      mustNotFail: row.mustNotFail.trim() || null,
      mustWinStatus: row.mustWinStatus,
      notFailStatus: row.notFailStatus,
    };
  });
}

export async function syncPlanObjectivesFromBsc(
  planId: string,
  rows: BscDimensionRow[],
): Promise<void> {
  const objectives = bscRowsToPlanObjectives(rows).filter(
    (o) => o.objective || o.keyResults.length > 0 || o.mustNotFail,
  );

  await prisma.$transaction(async (tx) => {
    await tx.planObjective.deleteMany({ where: { planId } });
    let sort = 0;
    for (const o of objectives) {
      const created = await tx.planObjective.create({
        data: {
          planId,
          dimension: o.dimension,
          objective: o.objective,
          mustNotFail: o.mustNotFail,
          mustWinStatus: o.mustWinStatus,
          notFailStatus: o.notFailStatus,
          sortOrder: sort++,
        },
      });
      let krSort = 0;
      for (const kr of o.keyResults) {
        await tx.planKeyResult.create({
          data: {
            objectiveId: created.id,
            keyResult: kr.keyResult,
            target: kr.target,
            sortOrder: krSort++,
          },
        });
      }
    }
  });
}

/** Copy compass metadata / milestones / premises from legacy companyNorthStar (once per empty slice). */
export async function migrateLegacyCompassToPlan(planId: string): Promise<boolean> {
  const nsRow = await prisma.companyNorthStar.findFirst({
    where: { active: true },
    include: {
      milestones: { orderBy: { year: "asc" } },
      premiseAudit: { orderBy: { code: "asc" } },
    },
  });
  if (!nsRow) return false;

  const plan = await prisma.strategicPlan.findUnique({
    where: { id: planId },
    include: { milestones: true, premises: true },
  });
  if (!plan) return false;

  const needsMeta =
    plan.targetYear == null ||
    plan.revenueTarget == null ||
    plan.profitMarginTarget == null;
  const needsMilestones = plan.milestones.length === 0 && nsRow.milestones.length > 0;
  const needsPremises = plan.premises.length === 0 && nsRow.premiseAudit.length > 0;
  if (!needsMeta && !needsMilestones && !needsPremises) return false;

  await prisma.$transaction(async (tx) => {
    if (needsMeta) {
      await tx.strategicPlan.update({
        where: { id: planId },
        data: {
          targetYear: plan.targetYear ?? nsRow.targetYear,
          revenueTarget: plan.revenueTarget ?? nsRow.revenueTarget,
          profitMarginTarget: plan.profitMarginTarget ?? nsRow.profitMarginTarget,
          marketPositionDesc: plan.marketPositionDesc ?? nsRow.marketPositionDesc,
          geographyDesc: plan.geographyDesc ?? nsRow.geographyDesc,
          brandDesc: plan.brandDesc ?? nsRow.brandDesc,
        },
      });
    }

    if (needsMilestones) {
      await tx.planMilestone.createMany({
        data: nsRow.milestones.map((m, i) => ({
          planId,
          year: m.year,
          label: m.label,
          revenueTarget: m.revenueTarget,
          profitMarginTarget: m.profitMarginTarget,
          keyConditions: m.keyConditions,
          revenueActual: m.revenueActual,
          progressNote: m.progressNote,
          riskScore: m.riskScore,
          riskFactors: m.riskFactors,
          sortOrder: i,
        })),
      });
    }

    if (needsPremises) {
      await tx.planPremise.createMany({
        data: nsRow.premiseAudit.map((p, i) => ({
          planId,
          code: p.code,
          premise: p.premise,
          category: p.category,
          confidence: p.confidence,
          fragility: p.fragility,
          lastValidatedAt: p.lastValidatedAt,
          validationNote: p.validationNote,
          failSignal: p.failSignal,
          signalSource: p.signalSource,
          signalAt: p.signalAt,
          sortOrder: i,
        })),
      });
    }
  });

  return true;
}

export async function ensurePlanMilestones(planId: string): Promise<PlanMilestoneView[]> {
  let plan = await prisma.strategicPlan.findUnique({
    where: { id: planId },
    include: { milestones: { orderBy: [{ sortOrder: "asc" }, { year: "asc" }] } },
  });
  if (!plan) return [];

  if (plan.milestones.length === 0) {
    await migrateLegacyCompassToPlan(planId);
    plan = await prisma.strategicPlan.findUnique({
      where: { id: planId },
      include: { milestones: { orderBy: [{ sortOrder: "asc" }, { year: "asc" }] } },
    });
  }

  return (plan?.milestones ?? []).map(mapMilestone);
}

export async function ensurePlanPremises(planId: string): Promise<PlanPremiseView[]> {
  let plan = await prisma.strategicPlan.findUnique({
    where: { id: planId },
    include: { premises: { orderBy: [{ sortOrder: "asc" }, { code: "asc" }] } },
  });
  if (!plan) return [];

  if (plan.premises.length === 0) {
    await migrateLegacyCompassToPlan(planId);
    plan = await prisma.strategicPlan.findUnique({
      where: { id: planId },
      include: { premises: { orderBy: [{ sortOrder: "asc" }, { code: "asc" }] } },
    });
  }

  return (plan?.premises ?? []).map(mapPremise);
}

/** Backfill decode fields on plan objectives from decode_bsc_rows when mustNotFail is empty. */
export async function backfillPlanDecodeFieldsFromLegacy(
  planId: string,
  period: string,
): Promise<void> {
  const [objectives, decodeRows] = await Promise.all([
    prisma.planObjective.findMany({ where: { planId } }),
    prisma.decodeBscRow.findMany({ where: { period } }),
  ]);
  if (objectives.length === 0 || decodeRows.length === 0) return;

  const byDim = Object.fromEntries(decodeRows.map((r) => [r.dim, r]));
  for (const obj of objectives) {
    if (obj.mustNotFail?.trim()) continue;
    const label = DIM_LABEL[obj.dimension as PlanDimension];
    const legacy = byDim[label];
    if (!legacy) continue;

    await prisma.planObjective.update({
      where: { id: obj.id },
      data: {
        mustNotFail: legacy.mustNotFail,
        mustWinStatus: legacy.mustWinStatus,
        notFailStatus: legacy.notFailStatus,
      },
    });
  }
}
