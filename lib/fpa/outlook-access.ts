import { asDbJson, dbAvailable, prisma, safeDbQuery } from "@/lib/db";
import * as demo from "@/lib/stratos-demo-data";
import type { FpaYearRow, SensitivityDriver } from "@/lib/types/stratos";
import { getActivePeriod } from "@/lib/data/active-period";

export type OutlookBundle = {
  fiveYearForecast: FpaYearRow[];
  sensitivityDrivers: SensitivityDriver[];
  source: "database" | "demo";
};

function defaultOutlook(): Omit<OutlookBundle, "source"> {
  return {
    fiveYearForecast: demo.fiveYearForecast,
    sensitivityDrivers: demo.sensitivityDrivers,
  };
}

function parseOutlookJson(
  fiveYearForecastJson: unknown,
  sensitivityJson: unknown,
): Omit<OutlookBundle, "source"> {
  const rows = fiveYearForecastJson as FpaYearRow[];
  const drivers = sensitivityJson as SensitivityDriver[];
  if (!Array.isArray(rows) || !Array.isArray(drivers)) {
    throw new Error("战略展望数据格式无效");
  }
  return { fiveYearForecast: rows, sensitivityDrivers: drivers };
}

async function seedOutlookIfEmpty(period: string): Promise<void> {
  const existing = await prisma.strategicOutlook.findUnique({ where: { period } });
  if (existing) return;
  const d = defaultOutlook();
  await prisma.strategicOutlook.create({
    data: {
      period,
      fiveYearForecastJson: asDbJson(d.fiveYearForecast),
      sensitivityJson: asDbJson(d.sensitivityDrivers),
    },
  });
}

export async function getOutlookBundle(period?: string): Promise<OutlookBundle> {
  const activePeriod = period ?? await getActivePeriod();
  const fallback = { ...defaultOutlook(), source: "demo" as const };
  if (!(await dbAvailable())) return fallback;
  return safeDbQuery(async () => {
    await seedOutlookIfEmpty(activePeriod);
    const row = await prisma.strategicOutlook.findUnique({ where: { period: activePeriod } });
    if (!row) return fallback;
    const parsed = parseOutlookJson(row.fiveYearForecastJson, row.sensitivityJson);
    return { ...parsed, source: "database" as const };
  }, fallback);
}

export async function saveOutlookBundle(
  payload: { fiveYearForecast: FpaYearRow[]; sensitivityDrivers: SensitivityDriver[] },
  period?: string,
): Promise<OutlookBundle> {
  const activePeriod = period ?? await getActivePeriod();
  if (!(await dbAvailable())) throw new Error("DATABASE_URL unset — 无法保存战略展望");
  await seedOutlookIfEmpty(activePeriod);
  const row = await prisma.strategicOutlook.findUnique({ where: { period: activePeriod } });
  if (!row) throw new Error("战略展望记录未找到");

  for (const r of payload.fiveYearForecast) {
    if (!r.year?.trim()) throw new Error("年度不能为空");
  }
  for (const d of payload.sensitivityDrivers) {
    if (!d.label?.trim()) throw new Error("敏感性驱动项名称不能为空");
  }

  await prisma.strategicOutlook.update({
    where: { id: row.id },
    data: {
      fiveYearForecastJson: asDbJson(payload.fiveYearForecast),
      sensitivityJson: asDbJson(payload.sensitivityDrivers),
    },
  });
  return { ...payload, source: "database" };
}
