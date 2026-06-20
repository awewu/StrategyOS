import type { BetGateStatus, FpaToggle, InvestmentCase, ProductBet, GtmBet } from "../types/stratos";

type Bet = Pick<InvestmentCase | ProductBet | GtmBet, "gateStatus" | "fpaToggle">;

export function syncBetFpaToggle(gateStatus: BetGateStatus): FpaToggle {
  switch (gateStatus) {
    case "approved":
    case "post_invest":
      return "on";
    case "rejected":
    case "killed":
      return "off";
    case "deferred":
      return "deferred";
    default:
      return "off";
  }
}

export function applyBetToggle<T extends Bet>(bet: T): T {
  return { ...bet, fpaToggle: syncBetFpaToggle(bet.gateStatus) };
}

export function forecastAmount(
  lineBudget: number,
  toggle: FpaToggle,
  ghost?: number
): { forecast: number; ghost: number | null } {
  if (toggle === "on") return { forecast: lineBudget, ghost: null };
  if (toggle === "deferred") return { forecast: lineBudget, ghost: null };
  return { forecast: 0, ghost: ghost ?? lineBudget };
}
