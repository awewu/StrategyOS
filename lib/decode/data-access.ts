import { dbAvailable, prisma } from "@/lib/db";
import { getActivePeriod } from "@/lib/data/active-period";
import type { TrafficLight } from "@/lib/types/stratos";
import { BSC_MAP, type BscDimensionRow } from "@/lib/decode/bsc-map";
import {
  backfillPlanDecodeFieldsFromLegacy,
  getActiveStrategicPlan,
  planObjectivesToBscRows,
  syncPlanObjectivesFromBsc,
} from "@/lib/data/strategic-plan-data";
import { HOSHIN_QUADRANTS, type HoshinEntry, type HoshinQuadrant } from "@/lib/decode/hoshin-data";

export type BscRowPayload = BscDimensionRow;
export type HoshinRowPayload = HoshinEntry & {
  rowLabel: string;
  colLabel: string;
  correlated: boolean;
};

function rowToBsc(r: {
  dim: string;
  objective: string;
  mustWin: string;
  operating: unknown;
  mustNotFail: string;
  mustWinStatus: TrafficLight;
  notFailStatus: TrafficLight;
}): BscDimensionRow {
  const operating = Array.isArray(r.operating)
    ? (r.operating as string[])
    : typeof r.operating === "string"
      ? [r.operating]
      : [];
  return {
    dim: r.dim,
    objective: r.objective,
    mustWin: r.mustWin,
    operating,
    mustNotFail: r.mustNotFail,
    mustWinStatus: r.mustWinStatus,
    notFailStatus: r.notFailStatus,
  };
}

function flattenHoshin(quadrants: HoshinQuadrant[]): HoshinRowPayload[] {
  return quadrants.flatMap((q) =>
    q.entries.map((e) => ({
      ...e,
      rowLabel: q.rowLabel,
      colLabel: q.colLabel,
      correlated: e.correlated ?? false,
    })),
  );
}

function groupHoshin(rows: HoshinRowPayload[]): HoshinQuadrant[] {
  const map = new Map<string, HoshinQuadrant>();
  for (const row of rows) {
    const key = `${row.rowLabel}|||${row.colLabel}`;
    if (!map.has(key)) {
      map.set(key, { rowLabel: row.rowLabel, colLabel: row.colLabel, entries: [] });
    }
    map.get(key)!.entries.push({
      id: row.id,
      label: row.label,
      tti: row.tti,
      okr: row.okr,
      action: row.action,
      owner: row.owner,
      correlated: row.correlated,
    });
  }
  return [...map.values()];
}

async function seedBscIfEmpty(period: string): Promise<void> {
  const n = await prisma.decodeBscRow.count({ where: { period } });
  if (n > 0) return;
  await prisma.decodeBscRow.createMany({
    data: BSC_MAP.map((r, i) => ({
      period,
      dim: r.dim,
      sortOrder: i,
      objective: r.objective,
      mustWin: r.mustWin,
      operating: r.operating,
      mustNotFail: r.mustNotFail,
      mustWinStatus: r.mustWinStatus,
      notFailStatus: r.notFailStatus,
    })),
  });
}

async function seedHoshinIfEmpty(period: string): Promise<void> {
  const n = await prisma.decodeHoshinEntry.count({ where: { period } });
  if (n > 0) return;
  let order = 0;
  const data = flattenHoshin(HOSHIN_QUADRANTS).map((e) => ({
    period,
    rowLabel: e.rowLabel,
    colLabel: e.colLabel,
    sortOrder: order++,
    label: e.label,
    tti: e.tti,
    okr: e.okr,
    action: e.action,
    owner: e.owner,
    correlated: e.correlated ?? false,
  }));
  await prisma.decodeHoshinEntry.createMany({ data });
}

export async function getDecodeBsc(period?: string): Promise<{
  rows: BscDimensionRow[];
  source: "database" | "demo";
}> {
  const activePeriod = period ?? await getActivePeriod();
  if (!(await dbAvailable())) {
    return { rows: BSC_MAP, source: "demo" };
  }

  const { plan } = await getActiveStrategicPlan();
  if (plan?.objectives.some((o) => o.objective.trim())) {
    const needsBackfill = plan.objectives.some((o) => !o.mustNotFail?.trim());
    if (needsBackfill) {
      await backfillPlanDecodeFieldsFromLegacy(plan.id, activePeriod);
      const refreshed = await getActiveStrategicPlan();
      if (refreshed.plan) {
        return {
          rows: planObjectivesToBscRows(refreshed.plan.objectives),
          source: "database",
        };
      }
    }
    return { rows: planObjectivesToBscRows(plan.objectives), source: "database" };
  }

  await seedBscIfEmpty(activePeriod);
  const rows = await prisma.decodeBscRow.findMany({
    where: { period: activePeriod },
    orderBy: { sortOrder: "asc" },
  });
  if (rows.length === 0) return { rows: BSC_MAP, source: "demo" };
  return { rows: rows.map(rowToBsc), source: "database" };
}

export async function getDecodeHoshin(period?: string): Promise<{
  quadrants: HoshinQuadrant[];
  flat: HoshinRowPayload[];
  source: "database" | "demo";
}> {
  const activePeriod = period ?? await getActivePeriod();
  if (!(await dbAvailable())) {
    const flat = flattenHoshin(HOSHIN_QUADRANTS);
    return { quadrants: HOSHIN_QUADRANTS, flat, source: "demo" };
  }
  await seedHoshinIfEmpty(activePeriod);
  const rows = await prisma.decodeHoshinEntry.findMany({
    where: { period: activePeriod },
    orderBy: { sortOrder: "asc" },
  });
  if (rows.length === 0) {
    const flat = flattenHoshin(HOSHIN_QUADRANTS);
    return { quadrants: HOSHIN_QUADRANTS, flat, source: "demo" };
  }
  const flat: HoshinRowPayload[] = rows.map((r) => ({
    id: r.id,
    rowLabel: r.rowLabel,
    colLabel: r.colLabel,
    label: r.label,
    tti: r.tti,
    okr: r.okr,
    action: r.action,
    owner: r.owner,
    correlated: r.correlated,
  }));
  return { quadrants: groupHoshin(flat), flat, source: "database" };
}

export async function saveDecodeBsc(
  rows: BscRowPayload[],
  period?: string,
  opts?: { syncToPlan?: boolean },
): Promise<{ count: number }> {
  const activePeriod = period ?? await getActivePeriod();
  if (!(await dbAvailable())) {
    throw new Error("DATABASE_URL unset — 无法保存解码数据");
  }

  const syncToPlan = opts?.syncToPlan !== false;
  const { plan } = await getActiveStrategicPlan();
  if (plan && syncToPlan) {
    await syncPlanObjectivesFromBsc(plan.id, rows);
  }

  await prisma.$transaction(async (tx) => {
    await tx.decodeBscRow.deleteMany({ where: { period: activePeriod } });
    await tx.decodeBscRow.createMany({
      data: rows.map((r, i) => ({
        period: activePeriod,
        dim: r.dim.trim(),
        sortOrder: i,
        objective: r.objective.trim(),
        mustWin: r.mustWin.trim(),
        operating: r.operating.filter(Boolean),
        mustNotFail: r.mustNotFail.trim(),
        mustWinStatus: r.mustWinStatus,
        notFailStatus: r.notFailStatus,
      })),
    });
  });
  return { count: rows.length };
}

export async function saveDecodeHoshin(
  rows: HoshinRowPayload[],
  period?: string,
): Promise<{ count: number }> {
  const activePeriod = period ?? await getActivePeriod();
  if (!(await dbAvailable())) {
    throw new Error("DATABASE_URL unset — 无法保存解码数据");
  }
  await prisma.$transaction(async (tx) => {
    await tx.decodeHoshinEntry.deleteMany({ where: { period: activePeriod } });
    await tx.decodeHoshinEntry.createMany({
      data: rows.map((r, i) => ({
        period: activePeriod,
        rowLabel: r.rowLabel.trim(),
        colLabel: r.colLabel.trim(),
        sortOrder: i,
        label: r.label.trim(),
        tti: r.tti.trim(),
        okr: r.okr.trim(),
        action: r.action.trim(),
        owner: r.owner.trim(),
        correlated: Boolean(r.correlated),
      })),
    });
  });
  return { count: rows.length };
}
