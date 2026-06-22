/**
 * Merge sanitized compile output into an existing StrategicPlan.
 */
import { prisma } from "@/lib/db";
import type { CompiledStrategicPayload } from "./strategic-compiler";
import {
  isNearDuplicate,
  type SanitizeResult,
} from "./import-quality";

export type MergeImportReport = {
  mode: "merge" | "replace";
  addedObjectives: number;
  mergedKeyResults: number;
  skippedDuplicates: number;
  planObjectiveTotal: number;
  intentUpdated: boolean;
  northStarUpdated: boolean;
};

type ExistingObjective = {
  id: string;
  objective: string;
  sortOrder: number;
  keyResults: { id: string; keyResult: string; sortOrder: number }[];
};

function pickRicherString(existing: string | null | undefined, incoming: string | undefined): string | null {
  if (!incoming?.trim()) return existing ?? null;
  if (!existing?.trim()) return incoming.trim();
  return incoming.trim().length > existing.trim().length ? incoming.trim() : existing;
}

export async function mergeIntoStrategicPlan(
  planId: string,
  sanitized: SanitizeResult,
  opts?: { fileName?: string },
): Promise<MergeImportReport> {
  const payload = sanitized.payload;
  const existing = await prisma.planObjective.findMany({
    where: { planId },
    include: { keyResults: { orderBy: { sortOrder: "asc" } } },
    orderBy: { sortOrder: "asc" },
  });

  const plan = await prisma.strategicPlan.findUnique({
    where: { id: planId },
    select: { intent: true, northStar: true },
  });

  let addedObjectives = 0;
  let mergedKeyResults = 0;
  let skippedDuplicates = sanitized.rejected.filter((r) => r.reason === "duplicate_existing").length;

  const intentNext = pickRicherString(plan?.intent, payload.intent);
  const northStarNext = pickRicherString(plan?.northStar, payload.northStar);

  await prisma.strategicPlan.update({
    where: { id: planId },
    data: {
      intent: intentNext,
      northStar: northStarNext,
      status: "DRAFT",
    },
  });

  let maxSort = existing.reduce((m, o) => Math.max(m, o.sortOrder), -1);

  for (const item of sanitized.accepted) {
    const title = item.objective.objective?.trim() ?? "";
    const match = existing.find((e) => isNearDuplicate(e.objective, title));

    if (match) {
      skippedDuplicates++;
      const existingKrTexts = match.keyResults.map((k) => k.keyResult);
      let krSort = match.keyResults.reduce((m, k) => Math.max(m, k.sortOrder), -1);

      for (const kr of item.objective.keyResults) {
        const krText = kr.keyResult.trim();
        if (!krText) continue;
        if (existingKrTexts.some((t) => isNearDuplicate(t, krText))) continue;
        if (isNearDuplicate(krText, match.objective)) continue;

        await prisma.planKeyResult.create({
          data: {
            objectiveId: match.id,
            keyResult: krText.slice(0, 300),
            target: kr.target?.trim() || null,
            sortOrder: ++krSort,
          },
        });
        existingKrTexts.push(krText);
        mergedKeyResults++;
      }
      continue;
    }

    maxSort++;
    const created = await prisma.planObjective.create({
      data: {
        planId,
        dimension: item.objective.dimension,
        objective: title.slice(0, 300) || item.objective.keyResults[0]?.keyResult.slice(0, 300) || "—",
        sortOrder: maxSort,
      },
    });

    let kSort = 0;
    for (const kr of item.objective.keyResults) {
      const krText = kr.keyResult.trim();
      if (!krText || isNearDuplicate(krText, created.objective)) continue;
      await prisma.planKeyResult.create({
        data: {
          objectiveId: created.id,
          keyResult: krText.slice(0, 300),
          target: kr.target?.trim() || null,
          sortOrder: kSort++,
        },
      });
    }

    existing.push({
      id: created.id,
      objective: created.objective,
      sortOrder: created.sortOrder,
      keyResults: [],
    });
    addedObjectives++;
  }

  if (opts?.fileName) {
    // Provenance is returned in API response; optional attachment when file is stored separately.
    void opts.fileName;
  }

  const total = await prisma.planObjective.count({ where: { planId } });

  return {
    mode: "merge",
    addedObjectives,
    mergedKeyResults,
    skippedDuplicates,
    planObjectiveTotal: total,
    intentUpdated: intentNext !== plan?.intent,
    northStarUpdated: northStarNext !== plan?.northStar,
  };
}

export async function replaceStrategicPlan(
  planId: string,
  payload: CompiledStrategicPayload,
): Promise<void> {
  await prisma.strategicPlan.update({
    where: { id: planId },
    data: {
      intent: payload.intent ?? null,
      northStar: payload.northStar ?? null,
      status: "DRAFT",
    },
  });

  await prisma.planObjective.deleteMany({ where: { planId } });
  let oSort = 0;
  for (const o of payload.objectives) {
    if (!o.objective?.trim() && o.keyResults.length === 0) continue;
    const created = await prisma.planObjective.create({
      data: {
        planId,
        dimension: o.dimension,
        objective: o.objective?.trim() ?? o.keyResults[0]?.keyResult?.slice(0, 80) ?? "",
        sortOrder: oSort++,
      },
    });
    let kSort = 0;
    for (const kr of o.keyResults) {
      if (!kr.keyResult.trim()) continue;
      await prisma.planKeyResult.create({
        data: {
          objectiveId: created.id,
          keyResult: kr.keyResult.trim(),
          target: kr.target?.trim() || null,
          sortOrder: kSort++,
        },
      });
    }
  }
}

export async function loadExistingObjectiveTitles(planId: string): Promise<string[]> {
  const rows = await prisma.planObjective.findMany({
    where: { planId },
    select: { objective: true, keyResults: { select: { keyResult: true } } },
  });
  const titles: string[] = [];
  for (const r of rows) {
    titles.push(r.objective);
    for (const kr of r.keyResults) titles.push(kr.keyResult);
  }
  return titles;
}
