/**
 * Unified working snapshot state — all getters, no demo hardcode in freeze.
 */
import {
  getDiagnosis,
  getFpaSummary,
  getCapStack,
  getInvestmentCases,
  getActiveHealthAssertions,
} from "@/lib/data/strategy-data";
import * as entities from "@/lib/data/entity-getters";
import { getStrategyPattern } from "@/lib/data/versions-data";
import type { HealthAssertion, SnapshotStatePayload } from "@/lib/types/stratos";

export interface WorkingSnapshotOptions {
  healthAssertions?: HealthAssertion[];
}

export async function buildWorkingSnapshotState(
  options: WorkingSnapshotOptions = {},
): Promise<SnapshotStatePayload> {
  const [
    diagnosis,
    fpa,
    capStack,
    investmentCases,
    brandCards,
    productBets,
    gtmBets,
    projects,
    assumptions,
    keyResults,
    capacity,
    healthAssertions,
    strategyPattern,
  ] = await Promise.all([
    getDiagnosis(),
    getFpaSummary(),
    getCapStack(),
    getInvestmentCases(),
    entities.getBrandCards(),
    entities.getProductBets(),
    entities.getGtmBets(),
    entities.getProjects(),
    entities.getAssumptions(),
    entities.getLeadingKeyResults(),
    entities.getCapacity(),
    options.healthAssertions ?? getActiveHealthAssertions(),
    getStrategyPattern(),
  ]);

  return {
    diagnosis,
    fpa,
    capStack,
    investmentCases,
    brandCards,
    productBets,
    gtmBets,
    projects,
    assumptions,
    keyResults,
    capacity,
    healthAssertions,
    strategyPattern,
  };
}
