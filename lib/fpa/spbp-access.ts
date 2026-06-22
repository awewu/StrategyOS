import { dbAvailable, prisma, safeDbQuery } from "@/lib/db";
import * as demo from "@/lib/stratos-demo-data";
import type { Scenario } from "@/lib/types/stratos";
import { getActivePeriod } from "@/lib/data/active-period";

export async function getSpbpEditable(period?: string): Promise<{
  scenarios: Scenario[];
  source: "database" | "demo";
}> {
  const activePeriod = period ?? await getActivePeriod();
  const fallback = { scenarios: demo.spbpScenarios, source: "demo" as const };
  if (!(await dbAvailable())) return fallback;
  return safeDbQuery(async () => {
    const rows = await prisma.spbpScenario.findMany({ where: { period: activePeriod } });
    if (rows.length === 0) return fallback;
    return { scenarios: rows.map(mapRow), source: "database" as const };
  }, fallback);
}

function mapRow(r: {
  code: string;
  name: string;
  probability: unknown;
  drivers: string[];
  revenueImpact: unknown;
  profitImpact: unknown;
  runwayMonths: unknown;
  linkedAssumptionCodes: string[];
}): Scenario {
  return {
    id: r.code,
    name: r.name,
    probability: Number(r.probability),
    drivers: r.drivers,
    fpaImpact: {
      revenue: Number(r.revenueImpact),
      profit: Number(r.profitImpact),
      runwayMonths: Number(r.runwayMonths),
    },
    linkedAssumptionCodes: r.linkedAssumptionCodes,
  };
}

export async function saveSpbpScenarios(
  scenarios: Scenario[],
  period?: string,
): Promise<Scenario[]> {
  const activePeriod = period ?? await getActivePeriod();
  if (!(await dbAvailable())) throw new Error("DATABASE_URL unset — 无法保存 SPBP 情景");
  const saved: Scenario[] = [];
  for (const sc of scenarios) {
    const prob = sc.probability;
    if (prob < 0 || prob > 100) throw new Error("概率须在 0–100 之间");
    const row = await prisma.spbpScenario.upsert({
      where: { code: sc.id },
      update: {
        name: sc.name,
        probability: prob,
        drivers: sc.drivers,
        revenueImpact: sc.fpaImpact.revenue,
        profitImpact: sc.fpaImpact.profit,
        runwayMonths: sc.fpaImpact.runwayMonths,
        linkedAssumptionCodes: sc.linkedAssumptionCodes,
        period: activePeriod,
      },
      create: {
        code: sc.id,
        name: sc.name,
        probability: prob,
        drivers: sc.drivers,
        revenueImpact: sc.fpaImpact.revenue,
        profitImpact: sc.fpaImpact.profit,
        runwayMonths: sc.fpaImpact.runwayMonths,
        linkedAssumptionCodes: sc.linkedAssumptionCodes,
        period: activePeriod,
      },
    });
    saved.push(mapRow(row));
  }
  return saved;
}
