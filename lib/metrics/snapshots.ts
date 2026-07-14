import { dbAvailable, prisma } from "@/lib/db";
import { getActivePeriod } from "@/lib/data/active-period";

/**
 * 指标期次快照机制：把"只有当前值"的指标（承诺兑现率、Robust 总分、
 * BSC 红灯数）每期落一行，攒出跨期趋势。
 *
 * 触发方式（无 cron 依赖）：
 * - 机会式：趋势页每次加载时对当期做幂等 upsert（同期重复捕获只更新值）
 * - 手动：POST /api/metrics/snapshot（L3）
 */

export const METRIC_KEYS = {
  fulfillmentRate: "commitment_fulfillment_rate",
  robustOverall: "robust_overall",
  bscRedLights: "bsc_red_lights",
} as const;

export const METRIC_LABELS: Record<string, string> = {
  [METRIC_KEYS.fulfillmentRate]: "承诺兑现率 %",
  [METRIC_KEYS.robustOverall]: "StratRobust 总分",
  [METRIC_KEYS.bscRedLights]: "BSC 红灯数",
};

export type MetricPoint = { period: string; value: number; capturedAt: string };
export type MetricSeries = { metricKey: string; label: string; points: MetricPoint[] };

async function upsertSnapshot(period: string, metricKey: string, value: number, metadata?: Record<string, unknown>) {
  await prisma.metricSnapshot.upsert({
    where: { period_metricKey: { period, metricKey } },
    create: { period, metricKey, value, metadata: (metadata ?? undefined) as object | undefined },
    update: { value, metadata: (metadata ?? undefined) as object | undefined },
  });
}

/** 捕获当期快照（幂等）。返回捕获的指标数，DB 不可用时返回 0。 */
export async function captureMetricSnapshots(): Promise<number> {
  if (!(await dbAvailable())) return 0;
  const period = await getActivePeriod();
  const [{ getCommitmentRecords, getRobustView, getHealthBundle }, { computeCommitmentSummary }] =
    await Promise.all([
      import("@/lib/data/strategy-data"),
      import("@/lib/execution/commitment-summary"),
    ]);

  let captured = 0;

  try {
    const commitments = await getCommitmentRecords();
    const summary = computeCommitmentSummary(commitments);
    await upsertSnapshot(period, METRIC_KEYS.fulfillmentRate, summary.rate, {
      done: summary.done,
      total: summary.total,
    });
    captured++;
  } catch {
    /* 单指标失败不阻塞其它 */
  }

  try {
    const robust = await getRobustView();
    await upsertSnapshot(period, METRIC_KEYS.robustOverall, robust.overall);
    captured++;
  } catch {
    /* ignore */
  }

  try {
    const health = await getHealthBundle();
    const reds = Object.values(health.bscLights).filter((l) => l === "red").length;
    await upsertSnapshot(period, METRIC_KEYS.bscRedLights, reds, { lights: health.bscLights });
    captured++;
  } catch {
    /* ignore */
  }

  return captured;
}

/** 读取全部指标的期次序列（趋势图数据源） */
export async function getMetricSeries(): Promise<MetricSeries[]> {
  if (!(await dbAvailable())) return [];
  const rows = await prisma.metricSnapshot.findMany({
    orderBy: [{ metricKey: "asc" }, { period: "asc" }],
  });
  const byKey = new Map<string, MetricPoint[]>();
  for (const r of rows) {
    const list = byKey.get(r.metricKey) ?? [];
    list.push({
      period: r.period,
      value: Number(r.value),
      capturedAt: r.capturedAt.toISOString().slice(0, 10),
    });
    byKey.set(r.metricKey, list);
  }
  return [...byKey.entries()].map(([metricKey, points]) => ({
    metricKey,
    label: METRIC_LABELS[metricKey] ?? metricKey,
    points,
  }));
}
