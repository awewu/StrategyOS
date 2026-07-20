import { dbAvailable } from "@/lib/db";
import * as demo from "@/lib/stratos-demo-data";
import {
  getProjects,
  getHealthOverview,
  getCapacity,
} from "@/lib/data/entity-getters";
import type { AgentContext } from "./agent-prompts";
import type { ParsedReport } from "./report-agent";
import type { RobustnessDimensions } from "@/lib/types/stratos";

async function getSpbpScenariosFromDb() {
  if (!(await dbAvailable())) return demo.spbpScenarios;
  const { prisma } = await import("@/lib/db");
  const { getActivePeriod } = await import("@/lib/data/active-period");
  const period = await getActivePeriod();
  const rows = await prisma.spbpScenario.findMany({ where: { period } });
  if (rows.length === 0) return demo.spbpScenarios;
  return rows.map((r) => ({
    id: r.code,
    name: r.name,
    probability: Number(r.probability),
    drivers: [] as string[],
    fpaImpact: { revenue: 0, profit: 0, runwayMonths: 0 },
    linkedAssumptionCodes: [],
  }));
}

async function getTechSignalsFromDb() {
  if (!(await dbAvailable())) return demo.techSignals;
  const { prisma } = await import("@/lib/db");
  const rows = await prisma.techSignalRecord.findMany({ take: 10 });
  if (rows.length === 0) return demo.techSignals;
  return rows.map((r: { id: string; title: string; trl: number }) => ({
    id: r.id,
    title: r.title,
    trl: Number(r.trl ?? 0),
  }));
}

async function getStratDiffsFromDb() {
  if (!(await dbAvailable())) return demo.stratDiffs;
  const { prisma } = await import("@/lib/db");
  const rows = await prisma.diffRecord.findMany({ take: 5, orderBy: { createdAt: "desc" } });
  if (rows.length === 0) return demo.stratDiffs;
  return rows.map((r) => ({ title: r.title }));
}

async function getGateItemsFromDb() {
  if (!(await dbAvailable())) {
    return [
      { gate: "IC-04", status: "yellow", note: "review" },
      { gate: "V4", status: "yellow", note: "产能假设待补" },
    ];
  }
  const { prisma } = await import("@/lib/db");
  const rows = await prisma.investmentCase.findMany({ take: 10 });
  if (rows.length === 0) {
    return [
      { gate: "IC-04", status: "yellow", note: "review" },
      { gate: "V4", status: "yellow", note: "产能假设待补" },
    ];
  }
  return rows.map((r: { code: string; title: string; gateStatus: string }) => ({
    gate: r.code,
    status: String(r.gateStatus ?? "review"),
    note: r.title ?? "",
  }));
}

export async function gatherAgentContext(
  reportId: string,
  rawContent: string,
  parsed: ParsedReport,
  period: string,
): Promise<AgentContext> {
  const [
    projects,
    healthOverview,
    capacity,
    spbpScenarios,
    techSignals,
    stratDiffs,
    gateItems,
  ] = await Promise.all([
    getProjects().catch(() => demo.projects),
    getHealthOverview().catch(() => ({
      score: 0,
      quarter: period,
      dimensions: demo.bscLights,
      kpis: demo.demoHealthOverview.kpis,
    })),
    getCapacity().catch(() => demo.capacity),
    getSpbpScenariosFromDb().catch(() => demo.spbpScenarios),
    getTechSignalsFromDb().catch(() => demo.techSignals),
    getStratDiffsFromDb().catch(() => demo.stratDiffs),
    getGateItemsFromDb().catch(() => [
      { gate: "IC-04", status: "yellow", note: "review" },
      { gate: "V4", status: "yellow", note: "产能假设待补" },
    ]),
  ]);

  return {
    parsed,
    rawContent,
    reportId,
    period,
    fpa: {
      revenueForecast: demo.fpa.revenueForecast,
      cashRunwayMonths: demo.fpa.cashRunwayMonths,
      profitForecast: demo.fpa.profitForecast,
    },
    projects: projects.map((p: { code: string; name: string; status: string; riskLevel?: string }) => ({
      code: p.code,
      name: p.name,
      status: p.status,
      riskLevel: p.riskLevel,
    })),
    healthOverview: {
      score: healthOverview.score,
      kpis: healthOverview.kpis.map((k: { name: string; value: string; status: string }) => ({
        name: k.name,
        value: k.value,
        status: k.status,
      })),
    },
    spbpScenarios: spbpScenarios.map((s: { id: string; name: string; probability: number }) => ({
      id: s.id,
      name: s.name,
      probability: s.probability,
    })),
    techSignals: techSignals.map((s: { id: string; title: string; trl: number }) => ({
      id: s.id,
      title: s.title,
      trl: s.trl,
    })),
    stratDiffs: stratDiffs.map((d: { title: string }) => ({ title: d.title })),
    robustScore: demo.robustScore as RobustnessDimensions,
    gateItems,
    capacity: {
      utilizationPct: capacity.utilizationPct,
      gapUnits: capacity.gapUnits,
    },
  };
}
