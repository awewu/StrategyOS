import { dbAvailable, prisma } from "@/lib/db";
import {
  CHINA_STRATEGY_SUMMARY,
  normalizeChinaStrategyContent,
  type ChinaStrategySummaryData,
} from "@/lib/strategy/china-strategy-summary";
import { canViewDraftOnePager } from "@/lib/auth/permissions";
import type { RoleKey } from "@/lib/constants";
import {
  diffOnePagerContent,
  type OnePagerDiff,
  type OnePagerRevision,
  validateOnePagerBeforeApprove,
} from "@/lib/strategy/one-pager-validation";

export type OnePagerRecord = {
  id: string;
  slug: string;
  status: "DRAFT" | "APPROVED";
  content: ChinaStrategySummaryData;
  approvedAt: string | null;
  approvedBy: string | null;
  updatedAt: string;
};

const SLUG = "china-summary";

function demoRecord(): OnePagerRecord {
  return {
    id: "demo",
    slug: SLUG,
    status: "DRAFT",
    content: normalizeChinaStrategyContent({ ...CHINA_STRATEGY_SUMMARY, footerBrand: "Rhautt", pageNumber: 2 }),
    approvedAt: null,
    approvedBy: null,
    updatedAt: new Date().toISOString(),
  };
}

function onePagerDb() {
  const delegate = (prisma as { strategyOnePager?: typeof prisma.strategyOnePager }).strategyOnePager;
  return delegate ?? null;
}

function revisionDb() {
  const delegate = (prisma as { strategyOnePagerRevision?: typeof prisma.strategyOnePagerRevision })
    .strategyOnePagerRevision;
  return delegate ?? null;
}

function rowToRecord(row: {
  id: string;
  slug: string;
  status: "DRAFT" | "APPROVED";
  contentJson: unknown;
  approvedAt: Date | null;
  approvedBy: string | null;
  updatedAt: Date;
}): OnePagerRecord {
  return {
    id: row.id,
    slug: row.slug,
    status: row.status,
    content: normalizeChinaStrategyContent(row.contentJson as unknown as ChinaStrategySummaryData),
    approvedAt: row.approvedAt?.toISOString() ?? null,
    approvedBy: row.approvedBy,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getStrategyOnePagerForViewer(role: RoleKey): Promise<OnePagerRecord> {
  const record = await getStrategyOnePager();
  if (canViewDraftOnePager(role)) return record;
  if (record.status === "APPROVED") return record;

  return {
    ...record,
    status: "APPROVED",
    content: normalizeChinaStrategyContent({
      ...CHINA_STRATEGY_SUMMARY,
      footerBrand: record.content.footerBrand ?? "Rhautt",
      pageNumber: record.content.pageNumber ?? 2,
    }),
    approvedAt: null,
    approvedBy: null,
  };
}

export async function getStrategyOnePager(): Promise<OnePagerRecord> {
  const fallback = demoRecord();

  const db = onePagerDb();
  if (!db || !(await dbAvailable())) return fallback;

  const row = await db.findUnique({ where: { slug: SLUG } });
  if (!row) return fallback;
  return rowToRecord(row);
}

async function appendRevision(
  onePagerId: string,
  action: OnePagerRevision["action"],
  content: ChinaStrategySummaryData,
  actor: string | null,
  diff: OnePagerDiff | null
) {
  const revDb = revisionDb();
  if (!revDb || !(await dbAvailable())) return;

  await revDb.create({
    data: {
      onePagerId,
      action,
      actor,
      contentJson: content as object,
      diffJson: diff ? (diff as object) : undefined,
    },
  });
}

export async function saveStrategyOnePagerDraft(
  content: ChinaStrategySummaryData
): Promise<OnePagerRecord> {
  const db = onePagerDb();
  if (!db || !(await dbAvailable())) {
    throw new Error("DATABASE_UNAVAILABLE");
  }

  const normalized = normalizeChinaStrategyContent(content);
  const existing = await db.findUnique({ where: { slug: SLUG } });

  const row = await db.upsert({
    where: { slug: SLUG },
    create: {
      slug: SLUG,
      status: "DRAFT",
      contentJson: normalized as object,
    },
    update: {
      status: "DRAFT",
      contentJson: normalized as object,
      approvedAt: null,
      approvedBy: null,
    },
  });

  const before = existing
    ? normalizeChinaStrategyContent(existing.contentJson as unknown as ChinaStrategySummaryData)
    : CHINA_STRATEGY_SUMMARY;
  const diff = existing ? diffOnePagerContent(before, normalized) : null;
  if (diff?.changedModules.length || diff?.periodChanged || diff?.titleChanged) {
    await appendRevision(row.id, "draft_save", normalized, null, diff);
  }

  return rowToRecord(row);
}

export async function approveStrategyOnePager(
  content: ChinaStrategySummaryData,
  approvedBy: string
): Promise<OnePagerRecord> {
  const db = onePagerDb();
  if (!db || !(await dbAvailable())) {
    throw new Error("DATABASE_UNAVAILABLE");
  }

  const normalized = normalizeChinaStrategyContent(content);
  const validation = validateOnePagerBeforeApprove(normalized);
  if (!validation.ok) {
    throw new Error(validation.errors.join("；"));
  }

  const existing = await db.findUnique({ where: { slug: SLUG } });
  const before = existing
    ? normalizeChinaStrategyContent(existing.contentJson as unknown as ChinaStrategySummaryData)
    : CHINA_STRATEGY_SUMMARY;
  const diff = diffOnePagerContent(before, normalized);

  const row = await db.upsert({
    where: { slug: SLUG },
    create: {
      slug: SLUG,
      status: "APPROVED",
      contentJson: normalized as object,
      approvedAt: new Date(),
      approvedBy,
    },
    update: {
      status: "APPROVED",
      contentJson: normalized as object,
      approvedAt: new Date(),
      approvedBy,
    },
  });

  await appendRevision(row.id, "approve", normalized, approvedBy, diff);

  return rowToRecord(row);
}

export async function reviseStrategyOnePager(): Promise<OnePagerRecord> {
  const db = onePagerDb();
  if (!db || !(await dbAvailable())) {
    throw new Error("DATABASE_UNAVAILABLE");
  }

  const existing = await db.findUnique({ where: { slug: SLUG } });
  if (!existing) {
    return saveStrategyOnePagerDraft(CHINA_STRATEGY_SUMMARY);
  }

  const content = normalizeChinaStrategyContent(existing.contentJson as unknown as ChinaStrategySummaryData);

  const row = await db.update({
    where: { slug: SLUG },
    data: {
      status: "DRAFT",
      approvedAt: null,
      approvedBy: null,
    },
  });

  await appendRevision(row.id, "revise", content, null, null);

  return rowToRecord(row);
}

export async function listStrategyOnePagerRevisions(limit = 8): Promise<OnePagerRevision[]> {
  const revDb = revisionDb();
  const db = onePagerDb();
  if (!revDb || !db || !(await dbAvailable())) return [];

  const row = await db.findUnique({ where: { slug: SLUG } });
  if (!row) return [];

  const rows = await revDb.findMany({
    where: { onePagerId: row.id },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return rows.map((r) => ({
    id: r.id,
    action: r.action as OnePagerRevision["action"],
    actor: r.actor,
    diff: r.diffJson as OnePagerDiff | null,
    content: normalizeChinaStrategyContent(r.contentJson as unknown as ChinaStrategySummaryData),
    createdAt: r.createdAt.toISOString(),
  }));
}