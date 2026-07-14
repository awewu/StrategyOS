/**
 * DB-backed access for the 12-dim strategic-health scores that power StratRobust.
 *
 * Seeds from the canonical `twelveDimensions` registry when a period is empty,
 * resolves the prior period for period-over-period deltas, and hands everything
 * to the pure `buildRobustView` aggregator. Targets are never invented.
 */
import { dbAvailable, prisma } from "@/lib/db";
import { getActivePeriod } from "@/lib/data/active-period";
import { twelveDimensions } from "./twelve-dimensions";
import { buildRobustView, type RobustDimInput, type RobustView } from "./robust-view";
import type { TrafficLight } from "@/lib/types/stratos";

const PHASE: Record<string, number> = { Q1: 1, H1: 2, Q2: 3, Q3: 4, H2: 5, Q4: 6, FY: 7 };

/** Monotonic ordinal for a period label (year * 10 + phase), or null if unparseable. */
function periodValue(label: string): number | null {
  const m = /^(\d{4})-(FY|H1|H2|Q1|Q2|Q3|Q4)$/.exec(label.trim());
  if (!m) return null;
  return Number(m[1]) * 10 + (PHASE[m[2]] ?? 0);
}

/** Latest period strictly before `active`, or null when none exists. */
export function pickPriorPeriod(periods: string[], active: string): string | null {
  const av = periodValue(active);
  if (av == null) return null;
  let best: { label: string; v: number } | null = null;
  for (const p of periods) {
    const v = periodValue(p);
    if (v == null || v >= av) continue;
    if (!best || v > best.v) best = { label: p, v };
  }
  return best?.label ?? null;
}

async function seedTwelveDimIfEmpty(period: string): Promise<void> {
  const n = await prisma.twelveDimScore.count({ where: { period } });
  if (n > 0) return;
  await prisma.twelveDimScore.createMany({
    data: twelveDimensions.map((d) => ({
      period,
      dimId: d.id,
      score: d.score,
      signal: d.signal,
      source: "seed",
    })),
  });
}

export interface TwelveDimRowPayload {
  dimId: string;
  score: number;
  signal: TrafficLight;
  target: number | null;
  note: string | null;
}

function demoView(period: string): RobustView {
  return buildRobustView({ period, priorPeriod: null, source: "demo", current: {}, prior: null });
}

export async function getRobustView(period?: string): Promise<RobustView> {
  const active = period ?? (await getActivePeriod());
  if (!(await dbAvailable())) return demoView(active);
  try {
    await seedTwelveDimIfEmpty(active);
    const curRows = await prisma.twelveDimScore.findMany({ where: { period: active } });
    if (curRows.length === 0) return demoView(active);

    const current: Record<string, RobustDimInput> = {};
    for (const r of curRows) {
      current[r.dimId] = { score: r.score, signal: r.signal as TrafficLight, target: r.target ?? null };
    }

    const periodRows = await prisma.twelveDimScore.findMany({
      distinct: ["period"],
      select: { period: true },
    });
    const priorPeriod = pickPriorPeriod(periodRows.map((p) => p.period), active);
    let prior: Record<string, number> | null = null;
    if (priorPeriod) {
      const priorRows = await prisma.twelveDimScore.findMany({ where: { period: priorPeriod } });
      prior = Object.fromEntries(priorRows.map((r) => [r.dimId, r.score]));
    }

    return buildRobustView({ period: active, priorPeriod, source: "database", current, prior });
  } catch {
    return demoView(active);
  }
}

export async function saveTwelveDim(
  rows: TwelveDimRowPayload[],
  period?: string,
): Promise<{ count: number }> {
  const active = period ?? (await getActivePeriod());
  if (!(await dbAvailable())) throw new Error("DATABASE_URL unset — 无法保存十二维评分");
  const valid = new Set(twelveDimensions.map((d) => d.id));
  for (const r of rows) {
    if (!valid.has(r.dimId)) throw new Error(`未知维度 ${r.dimId}`);
    if (!Number.isFinite(r.score) || r.score < 0 || r.score > 100) {
      throw new Error(`评分须 0–100，收到 ${r.score}`);
    }
    if (r.target != null && (r.target < 0 || r.target > 100)) {
      throw new Error(`目标须 0–100，收到 ${r.target}`);
    }
    if (!["green", "yellow", "red"].includes(r.signal)) {
      throw new Error(`signal 须为 green / yellow / red，收到 ${r.signal}`);
    }
  }
  await prisma.$transaction(
    rows.map((r) =>
      prisma.twelveDimScore.upsert({
        where: { period_dimId: { period: active, dimId: r.dimId } },
        update: {
          score: r.score,
          signal: r.signal,
          target: r.target ?? null,
          note: r.note ?? null,
          source: "manual",
        },
        create: {
          period: active,
          dimId: r.dimId,
          score: r.score,
          signal: r.signal,
          target: r.target ?? null,
          note: r.note ?? null,
          source: "manual",
        },
      }),
    ),
  );
  return { count: rows.length };
}
