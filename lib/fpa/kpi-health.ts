import { dbAvailable, prisma } from "@/lib/db";
import { getActivePeriod } from "@/lib/data/active-period";

/** KPI 值单位：决定渲染格式（百分比 / 金额万 / 比率 / 月数 / 计数）。 */
export type KpiUnit = "percent" | "currency" | "ratio" | "months" | "count";

/** 6 维度健康值 · null = 待接入（上线后录入）。 */
export type KpiHealthMetric = {
  id: string;
  name: string;
  category: string | null;
  unit: KpiUnit;
  currentValue: number | null;
  targetValue: number | null;
  priorYearValue: number | null;
  qtdValue: number | null;
  ytdValue: number | null;
  fullYearValue: number | null;
  higherIsBetter: boolean;
  sortOrder: number;
};

export type KpiHealthPayload = Omit<KpiHealthMetric, "id"> & { id?: string };

export type KpiHealthBundle = {
  metrics: KpiHealthMetric[];
  source: "database" | "demo";
};

/** 上线前的种子骨架：本期/目标可先接现有 FPA，其余维度留空待录入。 */
const DEMO_METRICS: Omit<KpiHealthMetric, "id">[] = [
  { name: "ROS 销售净利率", category: "盈利能力", unit: "percent", currentValue: 11.2, targetValue: 11.7, priorYearValue: null, qtdValue: null, ytdValue: null, fullYearValue: null, higherIsBetter: true, sortOrder: 0 },
  { name: "EBITDA 利润率", category: "盈利能力", unit: "percent", currentValue: 17.3, targetValue: 17.9, priorYearValue: null, qtdValue: null, ytdValue: null, fullYearValue: null, higherIsBetter: true, sortOrder: 1 },
  { name: "营业收入", category: "增长", unit: "currency", currentValue: null, targetValue: null, priorYearValue: null, qtdValue: null, ytdValue: null, fullYearValue: null, higherIsBetter: true, sortOrder: 2 },
  { name: "现金 Runway", category: "现金", unit: "months", currentValue: null, targetValue: 3, priorYearValue: null, qtdValue: null, ytdValue: null, fullYearValue: null, higherIsBetter: true, sortOrder: 3 },
];

function toNum(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function normalizeUnit(u: string): KpiUnit {
  return (["percent", "currency", "ratio", "months", "count"] as const).includes(u as KpiUnit)
    ? (u as KpiUnit)
    : "percent";
}

/** 首次访问播种骨架行，供上线后录入（与 seedFpaIfEmpty 一致的读时播种模式）。 */
async function seedKpiHealthIfEmpty(period: string): Promise<void> {
  const count = await prisma.kpiHealthMetric.count({ where: { period, scope: "company" } });
  if (count > 0) return;
  await prisma.kpiHealthMetric.createMany({
    data: DEMO_METRICS.map((m) => ({
      period,
      scope: "company" as const,
      name: m.name,
      category: m.category,
      unit: m.unit,
      currentValue: m.currentValue,
      targetValue: m.targetValue,
      priorYearValue: m.priorYearValue,
      qtdValue: m.qtdValue,
      ytdValue: m.ytdValue,
      fullYearValue: m.fullYearValue,
      higherIsBetter: m.higherIsBetter,
      sortOrder: m.sortOrder,
    })),
    skipDuplicates: true,
  });
}

export async function getKpiHealthMetrics(period?: string): Promise<KpiHealthBundle> {
  const activePeriod = period ?? (await getActivePeriod());
  if (!(await dbAvailable())) {
    return {
      metrics: DEMO_METRICS.map((m, i) => ({ id: `demo-${i}`, ...m })),
      source: "demo",
    };
  }
  await seedKpiHealthIfEmpty(activePeriod);
  const rows = await prisma.kpiHealthMetric.findMany({
    where: { period: activePeriod, scope: "company" },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return {
    metrics: rows.map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      unit: normalizeUnit(r.unit),
      currentValue: toNum(r.currentValue),
      targetValue: toNum(r.targetValue),
      priorYearValue: toNum(r.priorYearValue),
      qtdValue: toNum(r.qtdValue),
      ytdValue: toNum(r.ytdValue),
      fullYearValue: toNum(r.fullYearValue),
      higherIsBetter: r.higherIsBetter,
      sortOrder: r.sortOrder,
    })),
    source: "database",
  };
}

/** 全量替换某期的 KPI 健康表（编辑器保存时调用）。 */
export async function saveKpiHealthMetrics(
  metrics: KpiHealthPayload[],
  period?: string,
): Promise<KpiHealthBundle> {
  const activePeriod = period ?? (await getActivePeriod());
  if (!(await dbAvailable())) {
    return { metrics: metrics.map((m, i) => ({ id: `demo-${i}`, ...m })), source: "demo" };
  }
  await prisma.$transaction([
    prisma.kpiHealthMetric.deleteMany({ where: { period: activePeriod, scope: "company" } }),
    prisma.kpiHealthMetric.createMany({
      data: metrics.map((m, i) => ({
        period: activePeriod,
        scope: "company" as const,
        name: m.name.trim(),
        category: m.category?.trim() || null,
        unit: m.unit,
        currentValue: m.currentValue,
        targetValue: m.targetValue,
        priorYearValue: m.priorYearValue,
        qtdValue: m.qtdValue,
        ytdValue: m.ytdValue,
        fullYearValue: m.fullYearValue,
        higherIsBetter: m.higherIsBetter,
        sortOrder: m.sortOrder ?? i,
      })),
    }),
  ]);
  return getKpiHealthMetrics(activePeriod);
}
