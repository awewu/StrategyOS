import { resolveChecklistGate } from "@/lib/gates/checklist-gate";
import type {
  DealEconomicsInput,
  DealEconomicsResult,
  DealGateInput,
  DealGateResult,
  FootballField,
  SynergyItem,
  ValuationRange,
} from "./types";

const EPS = 1e-9;

export function synergyNpv(items: SynergyItem[], discountRate: number, horizonYears = 5): number {
  let npv = 0;
  for (const item of items) {
    for (let t = 1; t <= horizonYears; t++) {
      const rampIdx = Math.min(t - 1, item.ramp.length - 1);
      const rampPct = item.ramp.length > 0 ? Math.max(0, Math.min(1, item.ramp[rampIdx])) : 1;
      npv += (item.runRate * rampPct) / Math.pow(1 + discountRate, t);
    }
    npv -= item.oneTimeCost;
  }
  return npv;
}

export function footballField(valuations: ValuationRange[]): FootballField | null {
  if (valuations.length === 0) return null;
  const low = Math.min(...valuations.map((v) => v.low));
  const high = Math.max(...valuations.map((v) => v.high));
  const bases = valuations.map((v) => v.base).sort((a, b) => a - b);
  const mid = bases.length % 2 === 1
    ? bases[(bases.length - 1) / 2]
    : (bases[bases.length / 2 - 1] + bases[bases.length / 2]) / 2;
  return { low, high, medianBase: mid };
}

export function dealEconomics(input: DealEconomicsInput): DealEconomicsResult {
  const synergyPctOfPrice = input.price > EPS ? input.synergyNpvValue / input.price : 0;
  const roicSpread =
    input.roic !== undefined && input.wacc !== undefined ? input.roic - input.wacc : null;
  return { synergyPctOfPrice, roicSpread };
}

export function evaluateDealGate(input: DealGateInput): DealGateResult {
  const { economics, minEvidence, thresholds, requiredFlags, flags, openDealBreakers, openConditions, strict } = input;
  const hard: string[] = [];
  const warnings: string[] = [];
  const pending: string[] = [];

  for (const breaker of openDealBreakers) {
    hard.push(`Deal-breaker 未解:${breaker}`);
  }

  if (economics.synergyPctOfPrice > thresholds.maxSynergyPctOfPrice) {
    hard.push(
      `协同占对价 ${(economics.synergyPctOfPrice * 100).toFixed(0)}% 超红线(>${(thresholds.maxSynergyPctOfPrice * 100).toFixed(0)}%)——靠协同撑估值`,
    );
  } else if (economics.synergyPctOfPrice > thresholds.maxSynergyPctOfPrice * 0.9) {
    warnings.push(`协同占对价 ${(economics.synergyPctOfPrice * 100).toFixed(0)}% 逼近红线`);
  }

  if (economics.roicSpread !== null && economics.roicSpread < thresholds.minRoicOverWacc) {
    hard.push("ROIC 未达 WACC 门槛——毁灭价值");
  }
  if (economics.paybackYears !== undefined && economics.paybackYears > thresholds.maxPaybackYears) {
    hard.push(`回收期 ${economics.paybackYears.toFixed(1)}年 超本形态阈值 ${thresholds.maxPaybackYears}年`);
  }

  if (minEvidence < thresholds.minEvidenceLevel) {
    hard.push(`论证证据最短板 L${minEvidence} < 门槛 L${thresholds.minEvidenceLevel}`);
  }

  for (const rf of requiredFlags) {
    if (flags[rf.key] !== true) hard.push(`本形态必备未满足:${rf.label}`);
  }

  for (const cp of openConditions) {
    pending.push(`先决条件未关:${cp}`);
  }

  const { verdict, blockers } = resolveChecklistGate(hard, pending, { strict });
  return { verdict, blockers, warnings };
}
