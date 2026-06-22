#!/usr/bin/env npx tsx
/**
 * Restore StrategicPlan snapshot (from plan:export JSON) into the database.
 *
 * Usage:
 *   npx tsx scripts/import-strategic-plan.ts backups/plan.json
 *   npx tsx scripts/import-strategic-plan.ts --file backups/plan.json --mode replace
 *   npx tsx scripts/import-strategic-plan.ts --file backups/plan.json --dry-run
 */
import fs from "node:fs";
import path from "node:path";
import {
  DEFAULT_GROUP_ORG_UNIT_ID,
  DEFAULT_HORIZON_END,
  DEFAULT_HORIZON_START,
} from "../lib/data/strategic-plan-data";
import type { Prisma } from "@prisma/client";
import { dbAvailable, prisma } from "../lib/db";

type Tx = Prisma.TransactionClient;

type ImportMode = "replace" | "merge";

interface ExportedKeyResult {
  id: string;
  objectiveId: string;
  target: string | null;
  sortOrder: number;
  keyResult: string;
}

interface ExportedObjective {
  id: string;
  planId: string;
  dimension: string;
  objective: string;
  mustNotFail: string | null;
  mustWinStatus: string;
  notFailStatus: string;
  sortOrder: number;
  keyResults: ExportedKeyResult[];
}

interface ExportedPlan {
  id: string;
  orgUnitId: string;
  horizonStart: number;
  horizonEnd: number;
  intent: string | null;
  northStar: string | null;
  targetYear: number | null;
  revenueTarget: string | null;
  profitMarginTarget: string | null;
  marketPositionDesc: string | null;
  geographyDesc: string | null;
  brandDesc: string | null;
  status: string;
  submittedById: string | null;
  submittedAt: string | null;
  lockedAt: string | null;
  objectives: ExportedObjective[];
  initiatives: Array<Record<string, unknown>>;
  milestones: Array<Record<string, unknown>>;
  premises: Array<Record<string, unknown>>;
  assumptions: Array<Record<string, unknown>>;
  resourceReqs: Array<Record<string, unknown>>;
  attachments: Array<Record<string, unknown>>;
  orgUnit?: unknown;
}

interface PlanSnapshot {
  exportedAt?: string;
  orgUnitId: string;
  horizonStart: number;
  horizonEnd: number;
  counts?: Record<string, number>;
  plan: ExportedPlan;
}

function parseArgs() {
  const args = process.argv.slice(2);
  let filePath: string | null = null;
  let mode: ImportMode = "replace";
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    if (arg === "--file" && args[i + 1]) {
      filePath = args[++i]!;
    } else if (arg === "--mode" && args[i + 1]) {
      const m = args[++i]!;
      if (m !== "replace" && m !== "merge") {
        console.error(`Invalid mode: ${m} (use replace or merge)`);
        process.exit(1);
      }
      mode = m;
    } else if (arg === "--dry-run") {
      dryRun = true;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else if (!arg.startsWith("-")) {
      filePath = arg;
    }
  }

  return { filePath, mode, dryRun };
}

function printHelp() {
  console.log(`Usage: npx tsx scripts/import-strategic-plan.ts [--file path.json] [--mode replace|merge] [--dry-run]

Modes:
  replace  Delete existing plan children at target slot, restore full snapshot (default)
  merge    Upsert plan + children by id; leave records not in snapshot untouched

Env (optional overrides when snapshot metadata missing):
  ORG_UNIT_ID   default ${DEFAULT_GROUP_ORG_UNIT_ID}
  HORIZON_START default ${DEFAULT_HORIZON_START}
  HORIZON_END   default ${DEFAULT_HORIZON_END}
`);
}

function loadSnapshot(filePath: string): PlanSnapshot {
  const abs = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
  if (!fs.existsSync(abs)) {
    console.error(`File not found: ${abs}`);
    process.exit(1);
  }
  const raw = fs.readFileSync(abs, "utf8");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error("Invalid JSON");
    process.exit(1);
  }
  if (!parsed || typeof parsed !== "object" || !("plan" in parsed)) {
    console.error("Snapshot must contain a top-level 'plan' object (plan:export format)");
    process.exit(1);
  }
  return parsed as PlanSnapshot;
}

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

async function resolveSubmitterId(submittedById: string | null): Promise<string | null> {
  if (!submittedById) return null;
  const user = await prisma.user.findUnique({ where: { id: submittedById }, select: { id: true } });
  return user?.id ?? null;
}

function planScalars(plan: ExportedPlan, submittedById: string | null) {
  return {
    orgUnitId: plan.orgUnitId,
    horizonStart: plan.horizonStart,
    horizonEnd: plan.horizonEnd,
    intent: plan.intent,
    northStar: plan.northStar,
    targetYear: plan.targetYear,
    revenueTarget: plan.revenueTarget,
    profitMarginTarget: plan.profitMarginTarget,
    marketPositionDesc: plan.marketPositionDesc,
    geographyDesc: plan.geographyDesc,
    brandDesc: plan.brandDesc,
    status: plan.status as "DRAFT" | "SUBMITTED" | "LOCKED",
    submittedById,
    submittedAt: parseDate(plan.submittedAt),
    lockedAt: parseDate(plan.lockedAt),
  };
}

async function deletePlanChildren(tx: Tx, planId: string) {
  await tx.planKeyResult.deleteMany({
    where: { objective: { planId } },
  });
  await tx.planObjective.deleteMany({ where: { planId } });
  await tx.planInitiative.deleteMany({ where: { planId } });
  await tx.planMilestone.deleteMany({ where: { planId } });
  await tx.planPremise.deleteMany({ where: { planId } });
  await tx.planAssumption.deleteMany({ where: { planId } });
  await tx.resourceRequest.deleteMany({ where: { planId } });
  await tx.planAttachment.deleteMany({ where: { planId } });
}

async function insertChildren(tx: Tx, planId: string, plan: ExportedPlan) {
  for (const o of plan.objectives) {
    await tx.planObjective.create({
      data: {
        id: o.id,
        planId,
        dimension: o.dimension as "FINANCIAL" | "CUSTOMER" | "PROCESS" | "LEARNING",
        objective: o.objective,
        mustNotFail: o.mustNotFail,
        mustWinStatus: o.mustWinStatus as "green" | "yellow" | "red",
        notFailStatus: o.notFailStatus as "green" | "yellow" | "red",
        sortOrder: o.sortOrder,
        keyResults: {
          create: o.keyResults.map((k) => ({
            id: k.id,
            keyResult: k.keyResult,
            target: k.target,
            sortOrder: k.sortOrder,
          })),
        },
      },
    });
  }

  for (const i of plan.initiatives) {
    await tx.planInitiative.create({
      data: {
        id: String(i.id),
        planId,
        title: String(i.title),
        description: (i.description as string | null) ?? null,
        ownerName: (i.ownerName as string | null) ?? null,
        q1Milestone: (i.q1Milestone as string | null) ?? null,
        q2Milestone: (i.q2Milestone as string | null) ?? null,
        q3Milestone: (i.q3Milestone as string | null) ?? null,
        q4Milestone: (i.q4Milestone as string | null) ?? null,
        sortOrder: Number(i.sortOrder ?? 999),
      },
    });
  }

  for (const m of plan.milestones) {
    await tx.planMilestone.create({
      data: {
        id: String(m.id),
        planId,
        year: Number(m.year),
        label: String(m.label),
        revenueTarget: m.revenueTarget != null ? String(m.revenueTarget) : null,
        profitMarginTarget: m.profitMarginTarget != null ? String(m.profitMarginTarget) : null,
        keyConditions: (m.keyConditions as string[]) ?? [],
        revenueActual: m.revenueActual != null ? String(m.revenueActual) : null,
        progressNote: (m.progressNote as string | null) ?? null,
        riskScore: m.riskScore != null ? Number(m.riskScore) : null,
        riskFactors: (m.riskFactors as string[]) ?? [],
        sortOrder: Number(m.sortOrder ?? 0),
      },
    });
  }

  for (const p of plan.premises) {
    await tx.planPremise.create({
      data: {
        id: String(p.id),
        planId,
        code: String(p.code),
        premise: String(p.premise),
        category: String(p.category),
        confidence: Number(p.confidence ?? 50),
        fragility: Number(p.fragility ?? 50),
        lastValidatedAt: parseDate(p.lastValidatedAt),
        validationNote: (p.validationNote as string | null) ?? null,
        failSignal: (p.failSignal as string | null) ?? null,
        signalSource: (p.signalSource as string | null) ?? null,
        signalAt: parseDate(p.signalAt),
        sortOrder: Number(p.sortOrder ?? 0),
      },
    });
  }

  for (const a of plan.assumptions) {
    await tx.planAssumption.create({
      data: {
        id: String(a.id),
        planId,
        assumption: String(a.assumption),
        critical: Boolean(a.critical),
      },
    });
  }

  for (const r of plan.resourceReqs) {
    await tx.resourceRequest.create({
      data: {
        id: String(r.id),
        planId,
        resourceType: String(r.resourceType),
        amount: r.amount != null ? String(r.amount) : null,
        unit: (r.unit as string | null) ?? null,
        justification: (r.justification as string | null) ?? null,
      },
    });
  }

  for (const att of plan.attachments) {
    await tx.planAttachment.create({
      data: {
        id: String(att.id),
        planId,
        filename: String(att.filename),
        mimeType: String(att.mimeType),
        sizeBytes: Number(att.sizeBytes ?? 0),
        storagePath: String(att.storagePath),
        uploadedAt: parseDate(att.uploadedAt) ?? new Date(),
      },
    });
  }
}

async function upsertChildrenMerge(tx: Tx, planId: string, plan: ExportedPlan) {
  for (const o of plan.objectives) {
    await tx.planObjective.upsert({
      where: { id: o.id },
      create: {
        id: o.id,
        planId,
        dimension: o.dimension as "FINANCIAL" | "CUSTOMER" | "PROCESS" | "LEARNING",
        objective: o.objective,
        mustNotFail: o.mustNotFail,
        mustWinStatus: o.mustWinStatus as "green" | "yellow" | "red",
        notFailStatus: o.notFailStatus as "green" | "yellow" | "red",
        sortOrder: o.sortOrder,
      },
      update: {
        planId,
        dimension: o.dimension as "FINANCIAL" | "CUSTOMER" | "PROCESS" | "LEARNING",
        objective: o.objective,
        mustNotFail: o.mustNotFail,
        mustWinStatus: o.mustWinStatus as "green" | "yellow" | "red",
        notFailStatus: o.notFailStatus as "green" | "yellow" | "red",
        sortOrder: o.sortOrder,
      },
    });
    for (const k of o.keyResults) {
      await tx.planKeyResult.upsert({
        where: { id: k.id },
        create: {
          id: k.id,
          objectiveId: o.id,
          keyResult: k.keyResult,
          target: k.target,
          sortOrder: k.sortOrder,
        },
        update: {
          objectiveId: o.id,
          keyResult: k.keyResult,
          target: k.target,
          sortOrder: k.sortOrder,
        },
      });
    }
  }

  for (const i of plan.initiatives) {
    const id = String(i.id);
    const data = {
      planId,
      title: String(i.title),
      description: (i.description as string | null) ?? null,
      ownerName: (i.ownerName as string | null) ?? null,
      q1Milestone: (i.q1Milestone as string | null) ?? null,
      q2Milestone: (i.q2Milestone as string | null) ?? null,
      q3Milestone: (i.q3Milestone as string | null) ?? null,
      q4Milestone: (i.q4Milestone as string | null) ?? null,
      sortOrder: Number(i.sortOrder ?? 999),
    };
    await tx.planInitiative.upsert({ where: { id }, create: { id, ...data }, update: data });
  }

  for (const m of plan.milestones) {
    const id = String(m.id);
    const data = {
      planId,
      year: Number(m.year),
      label: String(m.label),
      revenueTarget: m.revenueTarget != null ? String(m.revenueTarget) : null,
      profitMarginTarget: m.profitMarginTarget != null ? String(m.profitMarginTarget) : null,
      keyConditions: (m.keyConditions as string[]) ?? [],
      revenueActual: m.revenueActual != null ? String(m.revenueActual) : null,
      progressNote: (m.progressNote as string | null) ?? null,
      riskScore: m.riskScore != null ? Number(m.riskScore) : null,
      riskFactors: (m.riskFactors as string[]) ?? [],
      sortOrder: Number(m.sortOrder ?? 0),
    };
    await tx.planMilestone.upsert({ where: { id }, create: { id, ...data }, update: data });
  }

  for (const p of plan.premises) {
    const id = String(p.id);
    const data = {
      planId,
      code: String(p.code),
      premise: String(p.premise),
      category: String(p.category),
      confidence: Number(p.confidence ?? 50),
      fragility: Number(p.fragility ?? 50),
      lastValidatedAt: parseDate(p.lastValidatedAt),
      validationNote: (p.validationNote as string | null) ?? null,
      failSignal: (p.failSignal as string | null) ?? null,
      signalSource: (p.signalSource as string | null) ?? null,
      signalAt: parseDate(p.signalAt),
      sortOrder: Number(p.sortOrder ?? 0),
    };
    await tx.planPremise.upsert({ where: { id }, create: { id, ...data }, update: data });
  }

  for (const a of plan.assumptions) {
    const id = String(a.id);
    const data = {
      planId,
      assumption: String(a.assumption),
      critical: Boolean(a.critical),
    };
    await tx.planAssumption.upsert({ where: { id }, create: { id, ...data }, update: data });
  }

  for (const r of plan.resourceReqs) {
    const id = String(r.id);
    const data = {
      planId,
      resourceType: String(r.resourceType),
      amount: r.amount != null ? String(r.amount) : null,
      unit: (r.unit as string | null) ?? null,
      justification: (r.justification as string | null) ?? null,
    };
    await tx.resourceRequest.upsert({ where: { id }, create: { id, ...data }, update: data });
  }

  for (const att of plan.attachments) {
    const id = String(att.id);
    const data = {
      planId,
      filename: String(att.filename),
      mimeType: String(att.mimeType),
      sizeBytes: Number(att.sizeBytes ?? 0),
      storagePath: String(att.storagePath),
      uploadedAt: parseDate(att.uploadedAt) ?? new Date(),
    };
    await tx.planAttachment.upsert({ where: { id }, create: { id, ...data }, update: data });
  }
}

function countSnapshot(plan: ExportedPlan) {
  const krCount = plan.objectives.reduce((n, o) => n + o.keyResults.length, 0);
  return {
    objectives: plan.objectives.length,
    keyResults: krCount,
    initiatives: plan.initiatives.length,
    milestones: plan.milestones.length,
    premises: plan.premises.length,
    assumptions: plan.assumptions.length,
    resourceReqs: plan.resourceReqs.length,
    attachments: plan.attachments.length,
  };
}

async function importReplace(snapshot: PlanSnapshot) {
  const plan = snapshot.plan;
  const orgUnitId = snapshot.orgUnitId || plan.orgUnitId;
  const horizonStart = snapshot.horizonStart ?? plan.horizonStart;
  const horizonEnd = snapshot.horizonEnd ?? plan.horizonEnd;

  const orgUnit = await prisma.orgUnit.findUnique({ where: { id: orgUnitId }, select: { id: true, name: true } });
  if (!orgUnit) {
    throw new Error(`OrgUnit not found: ${orgUnitId} — run db:seed first`);
  }

  const submittedById = await resolveSubmitterId(plan.submittedById);
  const scalars = planScalars({ ...plan, orgUnitId, horizonStart, horizonEnd }, submittedById);

  await prisma.$transaction(async (tx) => {
    const slotConflict = await tx.strategicPlan.findFirst({
      where: { orgUnitId, horizonStart, horizonEnd, NOT: { id: plan.id } },
      select: { id: true },
    });
    if (slotConflict) {
      await tx.strategicPlan.delete({ where: { id: slotConflict.id } });
    }

    await tx.strategicPlan.upsert({
      where: { id: plan.id },
      create: { id: plan.id, ...scalars },
      update: scalars,
    });

    await deletePlanChildren(tx, plan.id);
    await insertChildren(tx, plan.id, plan);
  });

  return { planId: plan.id, orgUnitName: orgUnit.name };
}

async function importMerge(snapshot: PlanSnapshot) {
  const plan = snapshot.plan;
  const orgUnitId = snapshot.orgUnitId || plan.orgUnitId;
  const horizonStart = snapshot.horizonStart ?? plan.horizonStart;
  const horizonEnd = snapshot.horizonEnd ?? plan.horizonEnd;

  const orgUnit = await prisma.orgUnit.findUnique({ where: { id: orgUnitId }, select: { id: true, name: true } });
  if (!orgUnit) {
    throw new Error(`OrgUnit not found: ${orgUnitId} — run db:seed first`);
  }

  const submittedById = await resolveSubmitterId(plan.submittedById);
  const scalars = planScalars({ ...plan, orgUnitId, horizonStart, horizonEnd }, submittedById);

  await prisma.$transaction(async (tx) => {
    const existing = await tx.strategicPlan.findFirst({
      where: { orgUnitId, horizonStart, horizonEnd },
      select: { id: true },
    });
    const planId = existing?.id ?? plan.id;

    await tx.strategicPlan.upsert({
      where: { id: planId },
      create: { id: planId, ...scalars },
      update: scalars,
    });

    await upsertChildrenMerge(tx, planId, { ...plan, id: planId });
  });

  const row = await prisma.strategicPlan.findFirst({
    where: { orgUnitId, horizonStart, horizonEnd },
    select: { id: true },
  });
  return { planId: row!.id, orgUnitName: orgUnit.name };
}

async function main() {
  const { filePath, mode, dryRun } = parseArgs();
  if (!filePath) {
    printHelp();
    process.exit(1);
  }

  const snapshot = loadSnapshot(filePath);
  const counts = countSnapshot(snapshot.plan);
  const orgUnitId = snapshot.orgUnitId || snapshot.plan.orgUnitId;
  const horizonStart = snapshot.horizonStart ?? snapshot.plan.horizonStart;
  const horizonEnd = snapshot.horizonEnd ?? snapshot.plan.horizonEnd;

  if (!(await dbAvailable())) {
    console.error("Database unavailable — set DATABASE_URL and ensure schema is synced.");
    process.exit(1);
  }

  const existing = await prisma.strategicPlan.findFirst({
    where: { orgUnitId, horizonStart, horizonEnd },
    select: { id: true, status: true },
  });
  const orgUnit = await prisma.orgUnit.findUnique({ where: { id: orgUnitId }, select: { name: true } });

  const preview = {
    ok: true,
    dryRun,
    mode,
    file: filePath,
    exportedAt: snapshot.exportedAt ?? null,
    orgUnitId,
    orgUnitName: orgUnit?.name ?? null,
    horizon: `${horizonStart}-${horizonEnd}`,
    existingPlanId: existing?.id ?? null,
    snapshotPlanId: snapshot.plan.id,
    counts,
    attachmentNote:
      counts.attachments > 0
        ? "Attachment rows restore metadata only; binary files at storagePath are not copied."
        : null,
  };

  if (dryRun) {
    console.log(JSON.stringify(preview, null, 2));
    if (!orgUnit) {
      console.error(`\nWould fail: OrgUnit ${orgUnitId} not found`);
      process.exit(1);
    }
    await prisma.$disconnect();
    return;
  }

  if (!orgUnit) {
    console.error(`OrgUnit not found: ${orgUnitId}`);
    process.exit(1);
  }

  const result = mode === "replace" ? await importReplace(snapshot) : await importMerge(snapshot);

  const after = await prisma.strategicPlan.findUnique({
    where: { id: result.planId },
    include: {
      objectives: { include: { keyResults: true } },
    },
  });
  const afterKr = after?.objectives.reduce((n, o) => n + o.keyResults.length, 0) ?? 0;

  console.log(
    JSON.stringify(
      {
        ...preview,
        dryRun: false,
        planId: result.planId,
        orgUnit: result.orgUnitName,
        restored: {
          objectives: after?.objectives.length ?? 0,
          keyResults: afterKr,
          status: after?.status ?? null,
        },
      },
      null,
      2,
    ),
  );

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
