/**
 * StratSim system dynamics — stock/flow model with R/B/D feedback loops.
 */
import type { SimParams, SimSnapshot } from "./strat-sim";
import { DEFAULT_SIM_PARAMS } from "./strat-sim";

export interface DynamicsState {
  signings: number;
  reputation: number;
  profit: number;
  cash: number;
  pipeline: number;
  winRate: number;
  trainingStock: number;
}

export interface DynamicsStep extends SimSnapshot {
  stocks: DynamicsState;
  flows: {
    rFlow: number;
    bFlow: number;
    dFlow: number;
    cashBurn: number;
  };
}

const INITIAL: DynamicsState = {
  signings: 820,
  reputation: 68,
  profit: 720,
  cash: 1680,
  pipeline: 420,
  winRate: 58,
  trainingStock: 0,
};

export function runStratSimDynamics(
  horizonQuarters = 8,
  params: SimParams = DEFAULT_SIM_PARAMS,
  initial: DynamicsState = INITIAL
): DynamicsStep[] {
  const s = { ...initial };
  const results: DynamicsStep[] = [];
  const dt = 1;

  for (let q = 1; q <= horizonQuarters; q++) {
    const notes: string[] = [];
    const quarter = q <= 4 ? `2026-Q${q}` : `2027-Q${q - 4}`;

    // D: training stock accumulates and decays into win rate
    s.trainingStock += params.training * 0.4;
    s.trainingStock *= 0.85;
    const dFlow = s.trainingStock * params.reinforceStrength * 0.12;
    s.winRate += dFlow - params.delayQuarters * 0.3;
    if (dFlow > 0.5) notes.push("D: 培训存量 → 中标率");

    // R: reputation ↔ signings reinforcing loop
    const rFlow = params.reinforceStrength * (s.reputation / 100) * 15;
    s.signings += rFlow * dt;
    s.reputation += (s.signings / 1200) * params.reinforceStrength * 4;
    if (params.reinforceStrength > 0.55) notes.push("R: 增强环活跃");

    // B: price cut balancing loop
    let bFlow = 0;
    if (params.priceCut > 0) {
      bFlow = params.priceCut * params.balanceStrength * 50;
      s.signings += bFlow;
      s.profit -= params.priceCut * params.balanceStrength * 100;
      s.cash -= params.priceCut * 80;
      notes.push("B: 降价调节环");
    }

    s.pipeline += (s.winRate - 55) * 3 + bFlow * 0.2;
    s.profit += (s.pipeline / 500 - 1) * 40;
    s.cash += s.profit * 0.15 - 120;
    const runwayMonths = Math.max(0.8, s.cash / 800);

    s.signings = clamp(s.signings, 400, 2000);
    s.reputation = clamp(s.reputation, 30, 98);
    s.winRate = clamp(s.winRate, 35, 95);
    s.profit = clamp(s.profit, 200, 1200);

    results.push({
      quarter,
      signings: Math.round(s.signings),
      reputation: Math.round(s.reputation),
      profit: Math.round(s.profit),
      investment: Math.round(s.pipeline / 5),
      winRate: Math.round(s.winRate),
      runwayMonths: Math.round(runwayMonths * 10) / 10,
      notes,
      stocks: { ...s },
      flows: {
        rFlow: Math.round(rFlow * 10) / 10,
        bFlow: Math.round(bFlow * 10) / 10,
        dFlow: Math.round(dFlow * 10) / 10,
        cashBurn: Math.round((120 - s.profit * 0.15) * 10) / 10,
      },
    });
  }

  return results;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
