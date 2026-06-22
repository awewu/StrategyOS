#!/usr/bin/env npx tsx
/**
 * Export active StrategicPlan (+ objectives + KRs) to JSON snapshot.
 *
 * Usage:
 *   npx tsx scripts/export-strategic-plan.ts
 *   npx tsx scripts/export-strategic-plan.ts --out backups/plan-2026-06-22.json
 *   ORG_UNIT_ID=org-group-rhautt HORIZON_START=2026 HORIZON_END=2028 npx tsx scripts/export-strategic-plan.ts
 */
import fs from "node:fs";
import path from "node:path";
import {
  DEFAULT_GROUP_ORG_UNIT_ID,
  DEFAULT_HORIZON_END,
  DEFAULT_HORIZON_START,
} from "../lib/data/strategic-plan-data";
import { dbAvailable, prisma } from "../lib/db";

function parseArgs() {
  const args = process.argv.slice(2);
  let outPath: string | null = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--out" && args[i + 1]) {
      outPath = args[++i]!;
    } else if (args[i] === "--help" || args[i] === "-h") {
      console.log(`Usage: npx tsx scripts/export-strategic-plan.ts [--out path.json]

Env:
  ORG_UNIT_ID   default ${DEFAULT_GROUP_ORG_UNIT_ID}
  HORIZON_START default ${DEFAULT_HORIZON_START}
  HORIZON_END   default ${DEFAULT_HORIZON_END}
`);
      process.exit(0);
    }
  }
  return { outPath };
}

function defaultOutPath(orgUnitId: string, horizonStart: number, horizonEnd: number): string {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  return path.join("backups", `strategic-plan-${orgUnitId}-${horizonStart}-${horizonEnd}-${stamp}.json`);
}

async function main() {
  const { outPath: outArg } = parseArgs();
  const orgUnitId = process.env.ORG_UNIT_ID?.trim() || DEFAULT_GROUP_ORG_UNIT_ID;
  const horizonStart = Number(process.env.HORIZON_START ?? DEFAULT_HORIZON_START);
  const horizonEnd = Number(process.env.HORIZON_END ?? DEFAULT_HORIZON_END);

  if (!(await dbAvailable())) {
    console.error("Database unavailable — set DATABASE_URL and ensure schema is synced.");
    process.exit(1);
  }

  const plan = await prisma.strategicPlan.findFirst({
    where: { orgUnitId, horizonStart, horizonEnd },
    include: {
      orgUnit: { select: { id: true, name: true, level: true } },
      objectives: {
        include: { keyResults: { orderBy: { sortOrder: "asc" } } },
        orderBy: { sortOrder: "asc" },
      },
      initiatives: { orderBy: { sortOrder: "asc" } },
      milestones: { orderBy: [{ sortOrder: "asc" }, { year: "asc" }] },
      premises: { orderBy: [{ sortOrder: "asc" }, { code: "asc" }] },
      assumptions: true,
      resourceReqs: true,
      attachments: { orderBy: { uploadedAt: "asc" } },
    },
  });

  if (!plan) {
    console.error(`No plan for ${orgUnitId} ${horizonStart}-${horizonEnd}`);
    process.exit(1);
  }

  const krCount = plan.objectives.reduce((n, o) => n + o.keyResults.length, 0);
  const snapshot = {
    exportedAt: new Date().toISOString(),
    orgUnitId,
    horizonStart,
    horizonEnd,
    counts: {
      objectives: plan.objectives.length,
      keyResults: krCount,
      initiatives: plan.initiatives.length,
      milestones: plan.milestones.length,
    },
    plan,
  };

  const json = JSON.stringify(snapshot, (_, value) => {
    if (typeof value === "bigint") return value.toString();
    if (value instanceof Date) return value.toISOString();
    return value;
  }, 2);

  const outPath = outArg ?? defaultOutPath(orgUnitId, horizonStart, horizonEnd);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, json, "utf8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        outPath,
        orgUnit: plan.orgUnit.name,
        objectives: snapshot.counts.objectives,
        keyResults: snapshot.counts.keyResults,
        status: plan.status,
        intentPreview: plan.intent?.slice(0, 80) ?? null,
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
