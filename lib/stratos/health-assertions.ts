import type { HealthAssertion } from "../types/stratos";

export type AssertionTrigger =
  | "MON_RPT"
  | "QTR_REV"
  | "SHEET1_IMPORT"
  | "PRE_SNAPSHOT";

export interface AssertionContext {
  trigger: AssertionTrigger;
  reportId?: string;
  importBatch?: string;
  cashRunwayMonths?: number;
  majorIncidentFlag?: boolean;
  coreTalentChurnPct?: number;
  brandNps?: number;
}

export class SnapshotBlockedError extends Error {
  constructor(public readonly assertions: HealthAssertion[]) {
    super(`Snapshot blocked: ${assertions.map((a) => a.message).join("; ")}`);
    this.name = "SnapshotBlockedError";
  }
}

export function runHealthAssertions(ctx: AssertionContext): HealthAssertion[] {
  const out: HealthAssertion[] = [];
  const now = new Date().toISOString();

  if (ctx.cashRunwayMonths != null && ctx.cashRunwayMonths < 3) {
    out.push({
      id: `ha-runway-${now}`,
      assertionType: "runway",
      active: true,
      message: `一票否决：现金 runway ${ctx.cashRunwayMonths.toFixed(1)} 月`,
      metricValue: ctx.cashRunwayMonths,
      thresholdValue: 3,
      sourceReportId: ctx.reportId,
    });
  }

  if (ctx.majorIncidentFlag) {
    out.push({
      id: `ha-compliance-${now}`,
      assertionType: "compliance",
      active: true,
      message: "一票否决：重大质量/合规事故",
      sourceReportId: ctx.reportId,
    });
  }

  if (ctx.coreTalentChurnPct != null && ctx.coreTalentChurnPct > 30) {
    out.push({
      id: `ha-talent-${now}`,
      assertionType: "talent",
      active: true,
      message: `一票否决：核心团队流失 ${ctx.coreTalentChurnPct}%`,
      metricValue: ctx.coreTalentChurnPct,
      thresholdValue: 30,
      sourceReportId: ctx.reportId,
    });
  }

  if (ctx.brandNps != null && ctx.brandNps < 0) {
    out.push({
      id: `ha-brand-${now}`,
      assertionType: "brand",
      active: true,
      message: "一票否决：品牌危机（NPS<0）",
      metricValue: ctx.brandNps,
      thresholdValue: 0,
      sourceReportId: ctx.reportId,
    });
  }

  return out;
}

export function assertHealthBeforeSnapshot(
  active: HealthAssertion[]
): void {
  const blocking = active.filter((a) => a.active && !a.ceoExceptionNote);
  if (blocking.length > 0) throw new SnapshotBlockedError(blocking);
}

export function mergeAssertions(
  existing: HealthAssertion[],
  incoming: HealthAssertion[]
): HealthAssertion[] {
  const byType = new Map(existing.map((a) => [a.assertionType, a]));
  for (const item of incoming) {
    byType.set(item.assertionType, item);
  }
  return [...byType.values()];
}
