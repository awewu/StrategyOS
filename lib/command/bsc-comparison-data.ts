/**
 * 指挥舱 BSC 对比的数据装配层（DB 访问）。
 *  - 目标基线：仅取"已锁定(LOCKED)优先，其次已提交(SUBMITTED)"的最近快照 —— 草稿不进指挥舱。
 *  - 实际：HealthSignal.kpiValue（按维度）。
 *  - 红线：decode BSC 行的 mustNotFail + notFailStatus。
 * 组装后交由纯引擎 buildBscComparison 计算（红线/先导严格分离）。
 */
import { dbAvailable, prisma } from "@/lib/db";
import { getActivePeriod } from "@/lib/data/active-period";
import {
  DEFAULT_GROUP_ORG_UNIT_ID,
  DEFAULT_HORIZON_START,
  DEFAULT_HORIZON_END,
} from "@/lib/data/strategic-plan-data";
import { getDecodeBsc } from "@/lib/decode/data-access";
import { getFpaEditable } from "@/lib/fpa/data-access";
import { BSC_DIM_KEYS as DIM_KEYS, toBscDimKey as toDimKey, type BscDimKey } from "@/lib/decode/bsc-dimensions";
import type { TrafficLight } from "@/lib/types/stratos";
import {
  buildBscComparison,
  type ActualDim,
  type ActualKpi,
  type BaselineDim,
  type BscComparison,
  type ThresholdDim,
} from "./bsc-comparison";

interface SnapshotObjective {
  dimension?: string | null;
  keyResults?: Array<{ keyResult?: string | null; target?: string | null; kpiCode?: string | null }> | null;
}

async function getApprovedBaseline(): Promise<{ dims: BaselineDim[]; version: number | null; status: string | null; label: string | null }> {
  const rows = await prisma.$queryRaw<Array<{ version: number; status: string; submittedAt: Date; snapshotJson: unknown }>>`
    SELECT "version", "status", "submitted_at" AS "submittedAt", "snapshot_json" AS "snapshotJson"
    FROM "plan_submission_snapshots"
    WHERE "org_unit_id" = ${DEFAULT_GROUP_ORG_UNIT_ID}
      AND "horizon_start" = ${DEFAULT_HORIZON_START}
      AND "horizon_end" = ${DEFAULT_HORIZON_END}
      AND "status" IN ('LOCKED', 'SUBMITTED')
    ORDER BY ("status" = 'LOCKED') DESC, "version" DESC
    LIMIT 1
  `;
  const snap = rows[0];
  const empty = DIM_KEYS.map((key): BaselineDim => ({ key, krs: [] }));
  if (!snap) return { dims: empty, version: null, status: null, label: null };

  const payload = snap.snapshotJson as { objectives?: SnapshotObjective[] } | null;
  const byKey = new Map<BscDimKey, BaselineDim>(DIM_KEYS.map((key) => [key, { key, krs: [] }]));
  for (const obj of payload?.objectives ?? []) {
    const key = toDimKey(String(obj.dimension ?? ""));
    if (!key) continue;
    for (const kr of obj.keyResults ?? []) {
      const keyResult = (kr.keyResult ?? "").trim();
      const target = (kr.target ?? "").trim();
      if (!keyResult || !target) continue;
      byKey.get(key)!.krs.push({ keyResult, target, code: kr.kpiCode ?? null });
    }
  }
  const label = `V${snap.version} · ${snap.submittedAt.toISOString().slice(0, 10)} ${snap.status === "LOCKED" ? "已锁定" : "已提交"}`;
  return { dims: [...byKey.values()], version: snap.version, status: snap.status, label };
}

async function getActuals(period: string): Promise<ActualDim[]> {
  const [rows, fpaRes] = await Promise.all([
    prisma.healthSignal.findMany({ where: { period } }),
    getFpaEditable(period),
  ]);
  const byKey = new Map<BscDimKey, ActualDim>(
    DIM_KEYS.map((key) => [key, { key, light: "yellow" as TrafficLight, kpis: [] }]),
  );
  // 归不到维度的 KPI 行（历史 dimension='kpi' 且未标 bscDimension）并入所有维度池，
  // 供 code 精确 / 名称保守匹配 —— 修复"先导实际恒空"latent bug。
  const sharedKpis: ActualKpi[] = [];
  for (const r of rows) {
    if (r.kpiName) {
      const kpi: ActualKpi = {
        name: r.kpiName,
        value: r.kpiValue ?? null,
        target: r.kpiTarget ?? null,
        code: r.kpiCode ?? null,
      };
      const dimKey = toDimKey(r.bscDimension) ?? toDimKey(r.dimension);
      if (dimKey) byKey.get(dimKey)!.kpis.push(kpi);
      else sharedKpis.push(kpi);
    } else {
      const key = toDimKey(r.dimension);
      if (key) byKey.get(key)!.light = r.signal as TrafficLight;
    }
  }
  if (sharedKpis.length > 0) {
    for (const dim of byKey.values()) dim.kpis.push(...sharedKpis);
  }
  // 财务维度注入 FPA 预算/实际硬数据（营收/利润/现金），非模糊匹配。
  const fpa = fpaRes.fpa;
  byKey.get("financial")!.finance = {
    revenueActual: fpa.revenueActual,
    revenueBudget: fpa.revenueBudget,
    profitActual: fpa.profitActual,
    profitBudget: fpa.profitBudget,
    cashRunwayMonths: fpa.cashRunwayMonths,
  };
  return [...byKey.values()];
}

async function getThresholds(period: string): Promise<ThresholdDim[]> {
  const { rows } = await getDecodeBsc(period);
  const byKey = new Map<BscDimKey, ThresholdDim>(DIM_KEYS.map((key) => [key, { key, statements: [] }]));
  for (const r of rows) {
    const key = toDimKey(r.dim);
    if (!key) continue;
    if (r.mustNotFail?.trim()) {
      byKey.get(key)!.statements.push({ statement: r.mustNotFail.trim(), status: r.notFailStatus });
    }
  }
  return [...byKey.values()];
}

/** 指挥舱 BSC 目标 vs 实际 对比（DB 不可用时返回空基线，不报错）。 */
export async function getBscComparison(period?: string): Promise<BscComparison> {
  const activePeriod = period ?? (await getActivePeriod());
  if (!(await dbAvailable())) {
    return {
      ...buildBscComparison(
        DIM_KEYS.map((key) => ({ key, krs: [] })),
        [],
        [],
        { version: null, status: null, label: null },
      ),
      dataSource: "demo",
    };
  }
  const [baseline, actuals, thresholds] = await Promise.all([
    getApprovedBaseline(),
    getActuals(activePeriod),
    getThresholds(activePeriod),
  ]);
  return {
    ...buildBscComparison(baseline.dims, actuals, thresholds, {
      version: baseline.version,
      status: baseline.status,
      label: baseline.label,
    }),
    dataSource: "database",
  };
}
