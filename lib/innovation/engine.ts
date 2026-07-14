import type {
  ArbitrageInput,
  CapabilityGap,
  DealEconomics,
  DFV,
  EvidenceLevel,
  FAxisWeights,
  FeasibilityDimension,
  GateInput,
  GateResult,
  GateVerdict,
  OdiInput,
  SourcingOptions,
  SourcingResult,
  ViabilityRef,
} from "./types";

const EPS = 1e-9;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

export function annualArbitrageSaving(input: ArbitrageInput): number {
  const eff = clamp01(input.roundTripEff);
  return Math.max(0, input.dailyShiftedKwh) * Math.max(0, input.activeDays) * input.priceSpread * eff;
}

export function computePaybackYears(costPremium: number, annualSaving: number): number {
  if (annualSaving <= EPS) return Infinity;
  return costPremium / annualSaving;
}

export function odiOpportunity(input: OdiInput): number {
  return input.importance + Math.max(0, input.importance - input.satisfaction);
}

export function computeDesirability(odis: OdiInput[], wtpFactor = 1): number {
  if (odis.length === 0) return 0;
  const meanOpp = odis.reduce((sum, o) => sum + odiOpportunity(o), 0) / odis.length;
  const normalized = clamp((meanOpp / 20) * 100, 0, 100);
  return clamp(normalized * clamp01(wtpFactor), 0, 100);
}

export function computeFeasibility(dims: FeasibilityDimension[], weights: FAxisWeights): number {
  if (dims.length === 0) return 0;
  const totalWeight = dims.reduce((sum, d) => sum + (weights[d.key] ?? 0), 0);
  if (totalWeight <= EPS) {
    const equal = dims.reduce((sum, d) => sum + clamp(d.score, 0, 100), 0) / dims.length;
    return clamp(equal, 0, 100);
  }
  const weighted = dims.reduce((sum, d) => sum + clamp(d.score, 0, 100) * (weights[d.key] ?? 0), 0);
  return clamp(weighted / totalWeight, 0, 100);
}

export function computeViability(econ: DealEconomics, ref: ViabilityRef): number {
  const paybackScore = clamp01(ref.targetPaybackYears / Math.max(econ.paybackYears, EPS));
  const roicScore = clamp01((econ.roic - econ.wacc) / Math.max(ref.minRoicSpread, EPS));
  return clamp((0.5 * paybackScore + 0.5 * roicScore) * 100, 0, 100);
}

export function evidenceStrength(levels: EvidenceLevel[]): EvidenceLevel {
  if (levels.length === 0) return 1;
  return levels.reduce((min, l) => (l < min ? l : min), levels[0]);
}

export function evaluateGate(input: GateInput): GateResult {
  const { scores, minEvidence, thresholds, economics, killerAssumptions } = input;
  const hardBlockers: string[] = [];

  if (minEvidence < thresholds.minEvidenceLevel) {
    hardBlockers.push(`证据不足(当前 L${minEvidence} < 门槛 L${thresholds.minEvidenceLevel})`);
  }
  if (economics.paybackYears > thresholds.maxPaybackYears) {
    hardBlockers.push(`回收期超阈值(${economics.paybackYears.toFixed(1)}年 > ${thresholds.maxPaybackYears}年)`);
  }
  if (economics.roic - economics.wacc < thresholds.minRoicOverWacc) {
    hardBlockers.push("ROIC 未达 WACC 门槛");
  }
  const belowScore = (["d", "f", "v"] as const).filter((k) => scores[k] < thresholds.minScore);
  for (const k of belowScore) {
    hardBlockers.push(`${k.toUpperCase()} 分低于门槛(${scores[k]} < ${thresholds.minScore})`);
  }
  for (const killer of killerAssumptions) {
    if (killer.status === "failed") hardBlockers.push(`杀手假设已证伪:${killer.code}`);
  }

  const pendingKillers = killerAssumptions
    .filter((k) => k.status === "pending")
    .map((k) => `杀手假设待证伪:${k.code}`);

  let verdict: GateVerdict;
  if (hardBlockers.length > 0) verdict = "kill";
  else if (pendingKillers.length > 0) verdict = "hold";
  else verdict = "go";

  return { verdict, blockers: [...hardBlockers, ...pendingKillers] };
}

export function recommendSourcing(
  gaps: CapabilityGap[],
  opts: SourcingOptions = { readyThreshold: 0.6 },
): SourcingResult[] {
  return gaps.map((gap) => {
    const canBuildInTime = gap.buildMonths <= gap.windowMonths;
    const ready = gap.internalReadiness >= opts.readyThreshold;
    if (ready && canBuildInTime) {
      return { capability: gap.capability, decision: "build", reason: "内部就绪且时间充足" };
    }
    if (!canBuildInTime) {
      return { capability: gap.capability, decision: "buy", reason: "自研慢于时间窗,收购提速" };
    }
    return { capability: gap.capability, decision: "partner", reason: "能力不足但时间尚可,合作补位" };
  });
}

export function composeDFV(d: number, f: number, v: number): DFV {
  return { d: clamp(d, 0, 100), f: clamp(f, 0, 100), v: clamp(v, 0, 100) };
}
