import { prisma } from "@/lib/db";
import { refreshCompassAudit } from "@/lib/compass/sync-audit";
import { getActivePeriod } from "@/lib/data/active-period";

const RUNWAY_THRESHOLD = 3;

/** 从 FPA 公司口径同步 CashPosition，并触发 HealthAssertion + 罗盘审计 */
export async function syncRunwayFromFpa(opts?: {
  runwayMonths?: number;
  cashBalance?: number;
  monthlyBurn?: number;
}): Promise<{ runwayMonths: number }> {
  const PERIOD = await getActivePeriod();
  const fpa = await prisma.fpaPeriod.findFirst({
    where: { period: PERIOD, scope: "company" },
  });

  const existing = await prisma.cashPosition.findFirst({
    where: { period: PERIOD },
    orderBy: { asOfDate: "desc" },
  });

  let runway = opts?.runwayMonths;
  let cashBalance = opts?.cashBalance ?? (existing ? Number(existing.cashBalance) : 3200);
  let monthlyBurn = opts?.monthlyBurn ?? (existing ? Number(existing.monthlyBurn) : 800);

  if (runway == null && fpa?.cashActual && Number(fpa.profitActual) < 0) {
    cashBalance = Number(fpa.cashActual);
    monthlyBurn = Math.max(Math.abs(Number(fpa.profitActual)) / 12, 1);
    runway = cashBalance / monthlyBurn;
  }
  runway = runway ?? (existing ? Number(existing.runwayMonths) : 2.1);

  const data = {
    period: PERIOD,
    asOfDate: new Date(),
    cashBalance,
    monthlyBurn,
    runwayMonths: runway,
  };

  if (existing) {
    await prisma.cashPosition.update({ where: { id: existing.id }, data });
  } else {
    await prisma.cashPosition.create({ data });
  }

  const active = await prisma.healthAssertion.findFirst({
    where: { assertionType: "runway", active: true },
  });

  if (runway < RUNWAY_THRESHOLD) {
    if (active) {
      await prisma.healthAssertion.update({
        where: { id: active.id },
        data: {
          message: `一票否决：现金 runway ${runway.toFixed(1)} 月`,
          metricValue: runway,
          thresholdValue: RUNWAY_THRESHOLD,
        },
      });
    } else {
      await prisma.healthAssertion.create({
        data: {
          assertionType: "runway",
          active: true,
          triggeredAt: new Date(),
          message: `一票否决：现金 runway ${runway.toFixed(1)} 月`,
          metricValue: runway,
          thresholdValue: RUNWAY_THRESHOLD,
        },
      });
    }
  } else if (active) {
    await prisma.healthAssertion.update({
      where: { id: active.id },
      data: { active: false, clearedAt: new Date() },
    });
  }

  const ns = await prisma.companyNorthStar.findFirst({ where: { active: true } });
  if (ns) await refreshCompassAudit(ns.id, { assumptions: false, signals: true });

  return { runwayMonths: runway };
}
