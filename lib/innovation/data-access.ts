import { prisma, safeDbQuery } from "@/lib/db";
import {
  annualArbitrageSaving,
  composeDFV,
  computeDesirability,
  computeFeasibility,
  computePaybackYears,
  computeViability,
  evaluateGate,
  evidenceStrength,
  groundedEvidenceLevel,
  recommendSourcing,
} from "./engine";
import type {
  CapabilityGap,
  EvidenceLevel,
  FAxisWeights,
  FeasibilityDimension,
  GateThresholds,
  KillerAssumption,
  OdiInput,
} from "./types";
import { DEFAULT_GATE_THRESHOLDS, STAGE_ORDER } from "./views";
import type {
  BetView,
  ClaimView,
  EconomicsInput,
  InnovationBundle,
  LineView,
  StageGate,
} from "./views";

export { DEFAULT_GATE_THRESHOLDS, STAGE_ORDER };
export type { BetView, ClaimView, EconomicsInput, InnovationBundle, LineView, StageGate };

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function num(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export function parseThresholds(raw: unknown): GateThresholds {
  const r = asRecord(raw);
  return {
    maxPaybackYears: num(r.maxPaybackYears) ?? DEFAULT_GATE_THRESHOLDS.maxPaybackYears,
    minRoicOverWacc: num(r.minRoicOverWacc) ?? DEFAULT_GATE_THRESHOLDS.minRoicOverWacc,
    minScore: num(r.minScore) ?? DEFAULT_GATE_THRESHOLDS.minScore,
    minEvidenceLevel: (num(r.minEvidenceLevel) ?? DEFAULT_GATE_THRESHOLDS.minEvidenceLevel) as EvidenceLevel,
  };
}

export function resolvePayback(econ: EconomicsInput): number | null {
  if (econ.paybackYears !== undefined) return econ.paybackYears;
  const saving =
    econ.annualSaving ??
    (econ.dailyShiftedKwh !== undefined && econ.activeDays !== undefined && econ.priceSpread !== undefined
      ? annualArbitrageSaving({
          dailyShiftedKwh: econ.dailyShiftedKwh,
          activeDays: econ.activeDays,
          priceSpread: econ.priceSpread,
          roundTripEff: econ.roundTripEff ?? 1,
        })
      : undefined);
  if (econ.costPremium !== undefined && saving !== undefined) {
    return computePaybackYears(econ.costPremium, saving);
  }
  return null;
}

function stageIndex(stage: string): number {
  const idx = STAGE_ORDER.indexOf(stage as StageGate);
  return idx === -1 ? 0 : idx;
}

const RELAXED: GateThresholds = {
  maxPaybackYears: Number.POSITIVE_INFINITY,
  minRoicOverWacc: Number.NEGATIVE_INFINITY,
  minScore: 0,
  minEvidenceLevel: 1,
};

export function computeBetView(
  bet: {
    id: string;
    lineId: string;
    title: string;
    horizon: string;
    stageGate: string;
    nextCommitAmount: unknown;
    abandonRight: boolean;
    wtpFactor: unknown;
    odi: unknown;
    feasibilityDims: unknown;
    economics: unknown;
    capabilityGaps: unknown;
    claims: {
      id: string;
      axis: string;
      claim: string;
      warrant: string | null;
      rebuttal: string | null;
      evidence: { id: string; level: number; source: string; artifactRef: string | null; note: string | null; stale: boolean }[];
    }[];
    assumptions: { id: string; code: string; statement: string; status: string; testPlan: string | null }[];
  },
  weights: FAxisWeights,
  thresholds: GateThresholds,
): BetView {
  const odi = asArray<OdiInput>(bet.odi);
  const dims = asArray<FeasibilityDimension>(bet.feasibilityDims);
  const gaps = asArray<CapabilityGap>(bet.capabilityGaps);
  const econRaw = asRecord(bet.economics) as EconomicsInput;
  const wtpFactor = Number(bet.wtpFactor ?? 1);

  const payback = resolvePayback(econRaw);
  const hasEconomics = payback !== null && econRaw.roic !== undefined && econRaw.wacc !== undefined;

  const claims: ClaimView[] = bet.claims.map((c) => ({
    id: c.id,
    axis: c.axis,
    claim: c.claim,
    warrant: c.warrant,
    rebuttal: c.rebuttal,
    strength: evidenceStrength(
      c.evidence
        .filter((e) => !e.stale)
        .map((e) => groundedEvidenceLevel(e.level as EvidenceLevel, Boolean(e.artifactRef?.trim()))),
    ),
    evidence: c.evidence.map((e) => ({
      id: e.id,
      level: e.level as EvidenceLevel,
      effectiveLevel: groundedEvidenceLevel(e.level as EvidenceLevel, Boolean(e.artifactRef?.trim())),
      source: e.source,
      artifactRef: e.artifactRef,
      note: e.note,
      stale: e.stale,
    })),
  }));
  const minEvidence = evidenceStrength(claims.map((c) => c.strength));

  const d = computeDesirability(odi, wtpFactor);
  const f = computeFeasibility(dims, weights);
  const v = hasEconomics
    ? computeViability(
        { paybackYears: payback, roic: econRaw.roic!, wacc: econRaw.wacc! },
        { targetPaybackYears: thresholds.maxPaybackYears, minRoicSpread: Math.max(thresholds.minRoicOverWacc, 0.05) },
      )
    : 0;
  const scores = composeDFV(d, f, v);

  const strict = stageIndex(bet.stageGate) >= stageIndex("business_case");
  const killers: KillerAssumption[] = bet.assumptions.map((a) => ({
    code: a.code,
    status: a.status as KillerAssumption["status"],
  }));
  const gate = evaluateGate({
    scores,
    minEvidence,
    thresholds: strict ? thresholds : RELAXED,
    economics: hasEconomics
      ? { paybackYears: payback, roic: econRaw.roic!, wacc: econRaw.wacc! }
      : { paybackYears: 0, roic: 1, wacc: 0 },
    killerAssumptions: killers,
  });
  if (strict && !hasEconomics) {
    gate.blockers.push("经济性未填(回收期/ROIC/WACC),Business Case 起必填");
    if (gate.verdict === "go") gate.verdict = "hold";
  }

  return {
    id: bet.id,
    lineId: bet.lineId,
    title: bet.title,
    horizon: bet.horizon,
    stageGate: (STAGE_ORDER.includes(bet.stageGate as StageGate) ? bet.stageGate : "discovery") as StageGate,
    nextCommitAmount: bet.nextCommitAmount === null || bet.nextCommitAmount === undefined ? null : Number(bet.nextCommitAmount),
    abandonRight: bet.abandonRight,
    wtpFactor,
    odi,
    feasibilityDims: dims,
    capabilityGaps: gaps,
    economics: econRaw,
    paybackYears: payback,
    scores,
    minEvidence,
    gate,
    sourcing: recommendSourcing(gaps),
    claims,
    assumptions: bet.assumptions.map((a) => ({
      id: a.id,
      code: a.code,
      statement: a.statement,
      status: a.status,
      testPlan: a.testPlan,
    })),
  };
}

export async function getInnovationBundle(): Promise<InnovationBundle> {
  const rows = await safeDbQuery(
    () =>
      prisma.innovationProductLine.findMany({
        orderBy: { name: "asc" },
        include: {
          bets: {
            orderBy: { updatedAt: "desc" },
            include: {
              claims: { orderBy: { updatedAt: "asc" }, include: { evidence: { orderBy: { capturedAt: "asc" } } } },
              assumptions: { orderBy: { code: "asc" } },
            },
          },
        },
      }),
    [],
  );

  const lines: LineView[] = rows.map((line) => {
    const weights = asRecord(line.fAxisWeights) as FAxisWeights;
    const thresholds = parseThresholds(line.gateThresholds);
    return {
      id: line.id,
      name: line.name,
      lifecycleStage: line.lifecycleStage,
      dominantProblems: line.dominantProblems,
      fAxisWeights: weights,
      gateThresholds: thresholds,
      evidenceBar: line.evidenceBar,
      bets: line.bets.map((bet) => computeBetView(bet, weights, thresholds)),
    };
  });

  return { lines };
}
