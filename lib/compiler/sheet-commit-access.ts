/**
 * Sheet 导入 · 现状读取与确认入库(T4-P3)。
 * diff 逻辑在 sheet-diff.ts(纯函数);本文件只做 DB 读写:
 *   loadExistingRecords  按 sheetType 把 DB 现状拍平成与预检 records 同形态
 *   commitSheetRecords   事务 upsert;finance 入库后触发 §16.2 runway 断言
 */
import { dbAvailable, prisma } from "@/lib/db";
import { getActivePeriod } from "@/lib/data/active-period";
import { syncRunwayFromFpa } from "@/lib/fpa/runway-sync";
import { recordKey, SHEET_COMMIT_KEYS } from "./sheet-diff";

export interface CommitResult {
  created: number;
  updated: number;
  skipped: number;
  assertionTriggered: boolean;
}

const num = (v: unknown): number | undefined => {
  if (v === undefined || v === null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};
const str = (v: unknown): string | undefined => {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  return s === "" ? undefined : s;
};

/** DB 现状 → 与预检 records 同字段形态的 Map(key 按 SHEET_COMMIT_KEYS) */
export async function loadExistingRecords(
  sheetType: string,
): Promise<Map<string, Record<string, unknown>>> {
  const map = new Map<string, Record<string, unknown>>();
  if (!(await dbAvailable())) return map;
  const keyFields = SHEET_COMMIT_KEYS[sheetType];
  if (!keyFields) return map;
  const period = await getActivePeriod();

  let records: Record<string, unknown>[] = [];
  if (sheetType === "finance") {
    const rows = await prisma.fpaPeriod.findMany({ where: { scope: "company" } });
    const cash = await prisma.cashPosition.findMany({ orderBy: { asOfDate: "desc" } });
    records = rows.map((r) => ({
      period: r.period,
      revenueBudget: Number(r.revenueBudget),
      revenueActual: Number(r.revenueActual),
      revenueForecast: Number(r.revenueForecast),
      profitBudget: Number(r.profitBudget),
      profitActual: Number(r.profitActual),
      profitForecast: Number(r.profitForecast),
      cashRunwayMonths: (() => {
        const c = cash.find((x) => x.period === r.period);
        return c ? Number(c.runwayMonths) : undefined;
      })(),
    }));
  } else if (sheetType === "assumptions") {
    const rows = await prisma.assumption.findMany({ where: { period } });
    records = rows.map((r) => ({
      code: r.code,
      content: r.content,
      cynefinDomain: r.cynefinDomain,
      result: r.result,
    }));
  } else if (sheetType === "projects") {
    const rows = await prisma.project.findMany({ include: { owner: true } });
    records = rows.map((r) => ({
      code: r.code,
      name: r.name,
      progressPercent: r.progressPercent == null ? undefined : Number(r.progressPercent),
      status: r.status,
      budgetTotal: r.budgetTotal == null ? undefined : Number(r.budgetTotal),
      budgetSpent: r.budgetSpent == null ? undefined : Number(r.budgetSpent),
      riskLevel: r.riskLevel,
      owner: r.owner?.name,
    }));
  }

  for (const rec of records) {
    const key = recordKey(rec, keyFields);
    if (key) map.set(key, rec);
  }
  return map;
}

async function commitFinance(records: Record<string, unknown>[]): Promise<CommitResult> {
  let created = 0;
  let updated = 0;
  let skipped = 0;
  let latestRunway: number | undefined;

  for (const rec of records) {
    const period = str(rec.period);
    if (!period) {
      skipped += 1;
      continue;
    }
    const existing = await prisma.fpaPeriod.findFirst({ where: { period, scope: "company" } });
    const data = {
      revenueBudget: num(rec.revenueBudget) ?? (existing ? Number(existing.revenueBudget) : 0),
      revenueActual: num(rec.revenueActual) ?? (existing ? Number(existing.revenueActual) : 0),
      revenueForecast: num(rec.revenueForecast) ?? (existing ? Number(existing.revenueForecast) : 0),
      profitBudget: num(rec.profitBudget) ?? (existing ? Number(existing.profitBudget) : 0),
      profitActual: num(rec.profitActual) ?? (existing ? Number(existing.profitActual) : 0),
      profitForecast: num(rec.profitForecast) ?? (existing ? Number(existing.profitForecast) : 0),
    };
    if (existing) {
      await prisma.fpaPeriod.update({ where: { id: existing.id }, data });
      updated += 1;
    } else {
      await prisma.fpaPeriod.create({ data: { period, scope: "company", ...data } });
      created += 1;
    }

    const runway = num(rec.cashRunwayMonths);
    if (runway !== undefined) {
      const cash = await prisma.cashPosition.findFirst({
        where: { period },
        orderBy: { asOfDate: "desc" },
      });
      if (cash) {
        await prisma.cashPosition.update({ where: { id: cash.id }, data: { runwayMonths: runway } });
      } else {
        await prisma.cashPosition.create({
          data: { period, asOfDate: new Date(), cashBalance: 0, monthlyBurn: 0, runwayMonths: runway },
        });
      }
      latestRunway = runway;
    }
  }

  // §16.2:Sheet1 财务确认导入 = 断言触发节点(现金 runway)
  let assertionTriggered = false;
  if (latestRunway !== undefined) {
    const { runwayMonths } = await syncRunwayFromFpa({ runwayMonths: latestRunway });
    assertionTriggered = runwayMonths < 3;
  }

  return { created, updated, skipped, assertionTriggered };
}

async function commitAssumptions(records: Record<string, unknown>[]): Promise<CommitResult> {
  const period = await getActivePeriod();
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const rec of records) {
    const code = str(rec.code);
    const content = str(rec.content);
    if (!code || !content) {
      skipped += 1;
      continue;
    }
    const optional: Record<string, unknown> = {};
    const cyn = str(rec.cynefinDomain);
    if (cyn) optional.cynefinDomain = cyn;
    const result = str(rec.result);
    if (result) optional.result = result;

    const existing = await prisma.assumption.findUnique({
      where: { code_period: { code, period } },
    });
    if (existing) {
      await prisma.assumption.update({
        where: { id: existing.id },
        data: { content, ...optional },
      });
      updated += 1;
    } else {
      await prisma.assumption.create({
        data: { code, period, content, ...optional },
      });
      created += 1;
    }
  }
  return { created, updated, skipped, assertionTriggered: false };
}

async function commitProjects(records: Record<string, unknown>[]): Promise<CommitResult> {
  let created = 0;
  let updated = 0;
  let skipped = 0;
  const users = await prisma.user.findMany({ select: { id: true, name: true } });

  for (const rec of records) {
    const code = str(rec.code);
    const name = str(rec.name);
    if (!code || !name) {
      skipped += 1;
      continue;
    }
    const optional: Record<string, unknown> = {};
    const progress = num(rec.progressPercent);
    if (progress !== undefined) optional.progressPercent = progress;
    const status = str(rec.status);
    if (status) optional.status = status;
    const budgetTotal = num(rec.budgetTotal);
    if (budgetTotal !== undefined) optional.budgetTotal = budgetTotal;
    const budgetSpent = num(rec.budgetSpent);
    if (budgetSpent !== undefined) optional.budgetSpent = budgetSpent;
    const risk = str(rec.riskLevel);
    if (risk) optional.riskLevel = risk;
    const ownerName = str(rec.owner);
    if (ownerName) {
      const owner = users.find((u) => u.name === ownerName);
      if (owner) optional.ownerId = owner.id;
    }

    const existing = await prisma.project.findUnique({ where: { code } });
    if (existing) {
      await prisma.project.update({ where: { id: existing.id }, data: { name, ...optional } });
      updated += 1;
    } else {
      await prisma.project.create({ data: { code, name, ...optional } });
      created += 1;
    }
  }
  return { created, updated, skipped, assertionTriggered: false };
}

export async function commitSheetRecords(
  sheetType: string,
  records: Record<string, unknown>[],
): Promise<CommitResult> {
  if (!(await dbAvailable())) throw new Error("DATABASE_URL unset — 无法入库");
  if (sheetType === "finance") return commitFinance(records);
  if (sheetType === "assumptions") return commitAssumptions(records);
  if (sheetType === "projects") return commitProjects(records);
  throw new Error(`sheetType「${sheetType}」暂不支持入库`);
}
