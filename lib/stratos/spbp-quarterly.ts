import { getScenarios } from "@/lib/data/entity-getters";
import { updateScenarioProbabilities, type SpbpEvidence } from "./spbp-bayes";
import { parseReportContent, type ParsedReport } from "./report-agent";
import { dbAvailable, prisma } from "@/lib/db";
import { getActivePeriod } from "@/lib/data/active-period";
import type { Scenario } from "@/lib/types/stratos";

export interface SpbpUpdateResult {
  period: string;
  updated: boolean;
  scenarios: Scenario[];
  evidence: SpbpEvidence;
  source: "db" | "demo";
}

function deriveEvidenceFromParsed(parsed: ParsedReport): SpbpEvidence {
  const assertionCount = parsed.assertionTriggers.length;
  const patternCount = parsed.patterns.length;
  const hasDeliberateSuggestion = parsed.patterns.some((p) => p.suggestDeliberate);

  const favorsPessimistic = assertionCount > 0;
  const favorsOptimistic = assertionCount === 0 && patternCount > 0 && hasDeliberateSuggestion;
  const strength = Math.min(0.1 + assertionCount * 0.05 + patternCount * 0.02, 0.3);

  return { favorsPessimistic, favorsOptimistic, strength };
}

export async function runSpbpQuarterlyUpdate(
  reportId?: string,
  rawContent?: string,
): Promise<SpbpUpdateResult> {
  const period = await getActivePeriod();
  const scenarios = await getScenarios();
  const source = (await dbAvailable()) ? "db" : "demo";

  let evidence: SpbpEvidence;
  let parsed: ParsedReport | null = null;

  if (rawContent) {
    parsed = parseReportContent(reportId ?? "quarterly-update", rawContent, period);
    evidence = deriveEvidenceFromParsed(parsed);
  } else {
    evidence = { favorsPessimistic: false, strength: 0.05 };
  }

  const updated = updateScenarioProbabilities(scenarios, evidence);

  if (await dbAvailable()) {
    for (const sc of updated) {
      await prisma.spbpScenario.updateMany({
        where: { code: sc.id, period },
        data: { probability: sc.probability },
      }).catch(() => {});
    }
  }

  return {
    period,
    updated: true,
    scenarios: updated,
    evidence,
    source,
  };
}
