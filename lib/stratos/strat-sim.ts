/**
 * StratSim — lightweight feedback-loop simulation (R/B/D).
 * Discrete quarterly model for strategy meeting what-if.
 */
export interface SimParams {
  /** 增强环 R：签约 ↔ 口碑 */
  reinforceStrength: number;
  /** 调节环 B：降价 ↔ 份额 ↔ 利润 */
  balanceStrength: number;
  /** 延迟环 D：培训 → 中标率（季度） */
  delayQuarters: number;
  /** 降价力度 0–1 */
  priceCut: number;
  /** 渠道培训投入 0–1 */
  training: number;
}

export interface SimSnapshot {
  quarter: string;
  signings: number;
  reputation: number;
  profit: number;
  investment: number;
  winRate: number;
  runwayMonths: number;
  notes: string[];
}

export const DEFAULT_SIM_PARAMS: SimParams = {
  reinforceStrength: 0.6,
  balanceStrength: 0.5,
  delayQuarters: 2,
  priceCut: 0.15,
  training: 0.55,
};

/** Initial operating state for the simulation. Derive from live FPA via
 *  `deriveSimSeed(fpa)` (lib/stratos/calibrate) instead of hard-coding. */
export interface SimSeed {
  signings: number;
  reputation: number;
  profit: number;
  investment: number;
  winRate: number;
  runway: number;
}

export const DEFAULT_SIM_SEED: SimSeed = {
  signings: 820,
  reputation: 68,
  profit: 720,
  investment: 100,
  winRate: 58,
  runway: 2.1,
};

export function runStratSim(
  horizonQuarters = 8,
  params: SimParams = DEFAULT_SIM_PARAMS,
  seed: SimSeed = DEFAULT_SIM_SEED
): SimSnapshot[] {
  const results: SimSnapshot[] = [];
  let signings = seed.signings;
  let reputation = seed.reputation;
  let profit = seed.profit;
  let investment = seed.investment;
  let winRate = seed.winRate;
  let runway = seed.runway;

  const trainingQueue: number[] = Array(Math.max(1, params.delayQuarters)).fill(0);

  for (let q = 1; q <= horizonQuarters; q++) {
    const notes: string[] = [];
    const quarter =
      q <= 4 ? `2026-Q${q}` : `2027-Q${q - 4}`;

    trainingQueue.push(params.training);
    const delayed = trainingQueue.shift() ?? 0;
    if (delayed > 0.3) {
      winRate += delayed * 4;
      notes.push("D: 培训滞后生效 → 中标率↑");
    }
    winRate = clamp(winRate, 40, 95);

    const rBoost = params.reinforceStrength * (reputation / 100) * 12;
    signings += rBoost;
    reputation += params.reinforceStrength * (signings / 1200) * 3;
    reputation = clamp(reputation, 30, 95);
    if (params.reinforceStrength > 0.5) notes.push("R: 口碑增强环 — 勿过度乐观");

    if (params.priceCut > 0) {
      const shareGain = params.priceCut * params.balanceStrength * 45;
      const profitHit = params.priceCut * params.balanceStrength * 95;
      signings += shareGain;
      profit -= profitHit;
      investment -= profitHit * 0.08;
      notes.push("B: 降价调节 → 份额↑ 利润↓ ↔ FPA");
    }

    winRate += (signings / 1200 - 0.65) * 5;
    profit += (winRate - 55) * 2.5;
    investment = clamp(investment, 40, 150);

    runway -= params.priceCut * 0.15;
    runway += params.training * 0.02;
    runway = clamp(runway, 0.8, 6);

    results.push({
      quarter,
      signings: Math.round(signings),
      reputation: Math.round(reputation),
      profit: Math.round(profit),
      investment: Math.round(investment),
      winRate: Math.round(winRate),
      runwayMonths: Math.round(runway * 10) / 10,
      notes,
    });
  }

  return results;
}

export function simWarnings(trail: SimSnapshot[]): string[] {
  const warnings: string[] = [];
  const last = trail[trail.length - 1];
  if (!last) return warnings;
  if (last.runwayMonths < 3) warnings.push("现金 runway 跌破 3 月 — 触发 HealthAssertion");
  if (last.reputation > 88) warnings.push("R 环过热 — 涌现乐观需 deliberate 复核");
  if (last.profit < 600) warnings.push("B 环压制利润 — 检查 FPA Forecast 修订");
  return warnings;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
