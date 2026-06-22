import { dbAvailable, prisma } from "@/lib/db";
import * as demo from "@/lib/stratos-demo-data";
import type { FpaSummary } from "@/lib/types/stratos";
import { resetActivePeriodCache } from "@/lib/data/active-period";

export type FpaEditablePayload = {
  revenueBudget: number;
  revenueActual: number;
  revenueForecast: number;
  profitBudget: number;
  profitActual: number;
  profitForecast: number;
  cashRunwayMonths: number;
};

async function seedFpaIfEmpty(period: string): Promise<void> {
  const existing = await prisma.fpaPeriod.findFirst({
    where: { period, scope: "company" },
  });
  if (existing) return;
  const d = demo.fpa;
  await prisma.fpaPeriod.create({
    data: {
      period,
      scope: "company",
      revenueBudget: d.revenueBudget,
      revenueActual: d.revenueActual,
      revenueForecast: d.revenueForecast,
      profitBudget: d.profitBudget,
      profitActual: d.profitActual,
      profitForecast: d.profitForecast,
      financialSignal: "yellow",
    },
  });
  await prisma.cashPosition.create({
    data: {
      period,
      asOfDate: new Date(),
      cashBalance: 4200,
      monthlyBurn: 2000,
      runwayMonths: d.cashRunwayMonths,
    },
  });
  // A new company period row may shift the active period — invalidate the cache.
  resetActivePeriodCache();
}

export async function getFpaEditable(period = demo.CURRENT_PERIOD): Promise<{
  fpa: FpaSummary;
  source: "database" | "demo";
}> {
  if (!(await dbAvailable())) {
    return { fpa: demo.fpa, source: "demo" };
  }
  await seedFpaIfEmpty(period);
  const row = await prisma.fpaPeriod.findFirst({
    where: { period, scope: "company" },
  });
  const cash = await prisma.cashPosition.findFirst({
    where: { period },
    orderBy: { asOfDate: "desc" },
  });
  if (!row) return { fpa: demo.fpa, source: "demo" };
  return {
    fpa: {
      revenueBudget: Number(row.revenueBudget),
      revenueActual: Number(row.revenueActual),
      revenueForecast: Number(row.revenueForecast),
      profitBudget: Number(row.profitBudget),
      profitActual: Number(row.profitActual),
      profitForecast: Number(row.profitForecast),
      cashRunwayMonths: cash ? Number(cash.runwayMonths) : demo.fpa.cashRunwayMonths,
    },
    source: "database",
  };
}

export async function saveFpaEditable(
  payload: FpaEditablePayload,
  period = demo.CURRENT_PERIOD,
): Promise<FpaSummary> {
  if (!(await dbAvailable())) throw new Error("DATABASE_URL unset — 无法保存 FPA");
  await seedFpaIfEmpty(period);
  const row = await prisma.fpaPeriod.findFirst({
    where: { period, scope: "company" },
  });
  if (!row) throw new Error("FPA period 未找到");
  await prisma.fpaPeriod.update({
    where: { id: row.id },
    data: {
      revenueBudget: payload.revenueBudget,
      revenueActual: payload.revenueActual,
      revenueForecast: payload.revenueForecast,
      profitBudget: payload.profitBudget,
      profitActual: payload.profitActual,
      profitForecast: payload.profitForecast,
    },
  });
  const cash = await prisma.cashPosition.findFirst({
    where: { period },
    orderBy: { asOfDate: "desc" },
  });
  if (cash) {
    await prisma.cashPosition.update({
      where: { id: cash.id },
      data: { runwayMonths: payload.cashRunwayMonths },
    });
  } else {
    await prisma.cashPosition.create({
      data: {
        period,
        asOfDate: new Date(),
        cashBalance: 4200,
        monthlyBurn: 2000,
        runwayMonths: payload.cashRunwayMonths,
      },
    });
  }
  return {
    revenueBudget: payload.revenueBudget,
    revenueActual: payload.revenueActual,
    revenueForecast: payload.revenueForecast,
    profitBudget: payload.profitBudget,
    profitActual: payload.profitActual,
    profitForecast: payload.profitForecast,
    cashRunwayMonths: payload.cashRunwayMonths,
  };
}
