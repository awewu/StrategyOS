/**
 * Version library data — snapshots, diffs, strategy pattern.
 */
import { dbAvailable, prisma } from "@/lib/db";
import { buildDecisionLedger, type DecisionLedger } from "@/lib/review/decision-ledger";
import { getMemoryDiffRecords } from "@/lib/stratos/persist-diff";
import { computeStratDiff } from "@/lib/stratos/strat-diff";
import type { DataSource } from "@/lib/data/strategy-data";
import { getDataSource } from "@/lib/data/strategy-data";
import * as demo from "@/lib/stratos-demo-data";
import type { DiffRecord, SnapshotStatePayload, StrategyPattern } from "@/lib/types/stratos";

export interface SnapshotListItem {
  code: string;
  period: string;
  status: "FROZEN" | "WORKING";
  rate: number;
}

export async function getSnapshotList(): Promise<SnapshotListItem[]> {
  if (!(await dbAvailable())) return demo.snapshots;

  const rows = await prisma.strategicSnapshot.findMany({
    orderBy: { frozenAt: "asc" },
    include: { strategyPattern: true },
  });
  if (rows.length === 0) return demo.snapshots;

  return rows.map((r) => ({
    code: r.code,
    period: r.period,
    status: r.status === "FROZEN" ? "FROZEN" : "WORKING",
    rate: r.strategyPattern
      ? Number(r.strategyPattern.deliberateRealizationRate)
      : 0,
  }));
}

export async function getStratDiffs(): Promise<DiffRecord[]> {
  if (!(await dbAvailable())) return demo.stratDiffs;

  const rows = await prisma.diffRecord.findMany({
    orderBy: { createdAt: "asc" },
    take: 50,
  });
  if (rows.length === 0) {
    const mem = getMemoryDiffRecords();
    if (mem.length > 0) return mem;
    return demo.stratDiffs;
  }

  return rows.map((r) => ({
    category: r.category,
    severity: r.severity,
    title: r.title,
    detail: r.detail ?? undefined,
    formationType: r.formationType ?? undefined,
  }));
}

export async function getStrategyPattern(): Promise<StrategyPattern> {
  if (!(await dbAvailable())) return demo.strategyPattern;

  const row = await prisma.strategyPattern.findFirst({
    orderBy: { computedAt: "desc" },
  });
  if (!row) return demo.strategyPattern;

  return {
    deliberateRealizationRate: Number(row.deliberateRealizationRate),
    emergentPatterns: row.emergentPatterns as StrategyPattern["emergentPatterns"],
    unrealizedItems: row.unrealizedItems as StrategyPattern["unrealizedItems"],
    serendipitousItems: row.serendipitousItems as StrategyPattern["serendipitousItems"],
    learningPrompts: row.learningPrompts,
  };
}

/**
 * 决策记分卡基准对：取最近两个 FROZEN 快照的 stateJson；不足两个时回退 demo FY25→FY26。
 */
async function getDecisionLedgerPair(): Promise<{
  ledger: DecisionLedger;
  fromCode: string;
  toCode: string;
  isDemoBaseline: boolean;
}> {
  const demoResult = {
    ledger: buildDecisionLedger(demo.snapshotFY25, demo.snapshotFY26),
    fromCode: "2025-FY-STRATEGIC",
    toCode: "2026-FY-STRATEGIC",
    isDemoBaseline: true,
  };
  if (!(await dbAvailable())) return demoResult;

  const frozen = await prisma.strategicSnapshot.findMany({
    where: { status: "FROZEN" },
    orderBy: { frozenAt: "desc" },
    take: 2,
  });
  if (frozen.length < 2) return demoResult;

  const [toSnap, fromSnap] = frozen;
  return {
    ledger: buildDecisionLedger(
      fromSnap.stateJson as SnapshotStatePayload,
      toSnap.stateJson as SnapshotStatePayload,
    ),
    fromCode: fromSnap.code,
    toCode: toSnap.code,
    isDemoBaseline: false,
  };
}

export async function getVersionsBundle() {
  const source: DataSource = await getDataSource();
  const [snapshots, stratDiffs, strategyPattern, decisionLedger] = await Promise.all([
    getSnapshotList(),
    getStratDiffs(),
    getStrategyPattern(),
    getDecisionLedgerPair(),
  ]);

  return {
    source,
    snapshots,
    stratDiffs,
    strategyPattern,
    decisionLedger,
    snapshotFY25: demo.snapshotFY25,
    snapshotFY26: demo.snapshotFY26,
    compareDiffs:
      stratDiffs.length > 0
        ? stratDiffs
        : computeStratDiff(demo.snapshotFY25, demo.snapshotFY26, [
            {
              formationType: "emergent",
              title: "区县经销商自发组团签约",
              linkedOkr: [],
              suggestDeliberate: true,
              reportId: "rpt-2026-05",
            },
          ]),
  };
}

/** In-memory frozen snapshots when DB unavailable */
const memorySnapshots: Array<{
  code: string;
  period: string;
  frozenAt: string;
  stateJson: unknown;
}> = [];

export function pushMemorySnapshot(entry: (typeof memorySnapshots)[number]) {
  const idx = memorySnapshots.findIndex((s) => s.code === entry.code);
  if (idx >= 0) memorySnapshots[idx] = entry;
  else memorySnapshots.push(entry);
}

export function getMemorySnapshots() {
  return [...memorySnapshots];
}
