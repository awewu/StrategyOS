/**
 * Persist HealthAssertion records from structured contexts or parsed trigger strings.
 */
import { dbAvailable, prisma } from "@/lib/db";
import {
  runHealthAssertions,
  type AssertionContext,
} from "@/lib/stratos/health-assertions";
import type { HealthAssertion } from "@/lib/types/stratos";

function parseTriggerStrings(triggers: string[], reportId?: string): AssertionContext {
  const ctx: AssertionContext = { trigger: "MON_RPT", reportId };
  for (const t of triggers) {
    const lower = t.toLowerCase();
    const runwayMatch = t.match(/runway\s*(\d+\.?\d*)\s*月/);
    if (runwayMatch) {
      ctx.cashRunwayMonths = parseFloat(runwayMatch[1]);
    }
    if (lower.includes("重大") || lower.includes("合规") || lower.includes("事故") || lower.includes("质量")) {
      ctx.majorIncidentFlag = true;
    }
    const talentMatch = t.match(/流失\s*(\d+\.?\d*)%?/);
    if (talentMatch) {
      ctx.coreTalentChurnPct = parseFloat(talentMatch[1]);
    }
    const npsMatch = t.match(/nps\s*[<=-]?\s*(-?\d+\.?\d*)/);
    if (npsMatch) {
      ctx.brandNps = parseFloat(npsMatch[1]);
    }
  }
  return ctx;
}

export async function persistHealthAssertionsFromTriggers(
  triggers: string[],
  reportId?: string,
): Promise<HealthAssertion[]> {
  if (!(await dbAvailable())) return [];
  const ctx = parseTriggerStrings(triggers, reportId);
  const assertions = runHealthAssertions(ctx);
  return persistHealthAssertions(assertions);
}

export async function persistHealthAssertionsFromContext(
  ctx: AssertionContext,
): Promise<HealthAssertion[]> {
  if (!(await dbAvailable())) return [];
  const assertions = runHealthAssertions(ctx);
  return persistHealthAssertions(assertions);
}

export async function persistHealthAssertions(
  assertions: HealthAssertion[],
): Promise<HealthAssertion[]> {
  if (assertions.length === 0) return [];
  if (!(await dbAvailable())) return [];

  const types = assertions.map((a) => a.assertionType);
  const existingRows = await prisma.healthAssertion.findMany({
    where: { assertionType: { in: types }, active: true },
    select: { id: true, assertionType: true, sourceReportId: true, metricValue: true },
  });
  const existingByType = new Map(existingRows.map((r) => [r.assertionType, r]));
  const now = new Date();

  await prisma.$transaction(
    assertions.map((a) => {
      const existing = existingByType.get(a.assertionType);
      if (existing) {
        return prisma.healthAssertion.update({
          where: { id: existing.id },
          data: {
            triggeredAt: now,
            sourceReportId: a.sourceReportId ?? existing.sourceReportId,
            metricValue: a.metricValue ?? existing.metricValue,
            message: a.message ?? undefined,
          },
        });
      }
      return prisma.healthAssertion.create({
        data: {
          assertionType: a.assertionType,
          active: true,
          triggeredAt: now,
          sourceReportId: a.sourceReportId ?? null,
          message: a.message,
          metricValue: a.metricValue ?? null,
          thresholdValue: a.thresholdValue ?? null,
        },
      });
    }),
  );

  return assertions;
}
