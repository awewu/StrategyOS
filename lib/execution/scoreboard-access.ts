import { dbAvailable, prisma } from "@/lib/db";
import type { ObjectiveView } from "@/lib/data/entity-getters";
import * as demo from "@/lib/stratos-demo-data";
import type { KeyResult, StrategicDiagnosis } from "@/lib/types/stratos";

export type ScoreboardConfigPayload = {
  wigObjectiveId: string | null;
  leadingKrIds: string[];
  laggingKrIds: string[];
};

export type ScoreboardConfigBundle = ScoreboardConfigPayload & {
  source: "database" | "derived";
};

export type ResolvedScoreboard = {
  wigLabel: string;
  leadingKrs: KeyResult[];
  laggingKrs: KeyResult[];
  configSource: "database" | "derived";
};

export function buildDerivedScoreboardConfig(leadingKrs: KeyResult[]): ScoreboardConfigPayload {
  return {
    wigObjectiveId: null,
    leadingKrIds: leadingKrs.map((k) => k.id),
    laggingKrIds: [],
  };
}

export function parseScoreboardConfig(raw: unknown): ScoreboardConfigPayload {
  const body = raw as ScoreboardConfigPayload;
  if (!body || !Array.isArray(body.leadingKrIds) || !Array.isArray(body.laggingKrIds)) {
    throw new Error("4DX 记分板配置格式无效");
  }
  if (body.wigObjectiveId != null && typeof body.wigObjectiveId !== "string") {
    throw new Error("WIG 目标 ID 无效");
  }
  return {
    wigObjectiveId: body.wigObjectiveId?.trim() || null,
    leadingKrIds: body.leadingKrIds.filter((id) => typeof id === "string" && id.trim()),
    laggingKrIds: body.laggingKrIds.filter((id) => typeof id === "string" && id.trim()),
  };
}

export function resolveScoreboardView(
  config: ScoreboardConfigPayload,
  opts: {
    diagnosis: StrategicDiagnosis;
    objectives: ObjectiveView[];
    allKrs: KeyResult[];
    derivedLeadingKrs: KeyResult[];
  },
): ResolvedScoreboard {
  const krById = new Map(opts.allKrs.map((k) => [k.id, k]));
  const pickKrs = (ids: string[]) =>
    ids.map((id) => krById.get(id)).filter((k): k is KeyResult => k != null);

  const leadingIds =
    config.leadingKrIds.length > 0
      ? config.leadingKrIds
      : opts.derivedLeadingKrs.map((k) => k.id);
  const leadingKrs =
    pickKrs(leadingIds).length > 0 ? pickKrs(leadingIds) : opts.derivedLeadingKrs;

  const laggingKrs = pickKrs(config.laggingKrIds);

  const wigFromObjective = config.wigObjectiveId
    ? opts.objectives.find((o) => o.id === config.wigObjectiveId)?.title
    : undefined;
  const wigLabel = wigFromObjective ?? opts.diagnosis.crux;

  return {
    wigLabel,
    leadingKrs,
    laggingKrs,
    configSource: "derived",
  };
}

export function mergeScoreboardSource(
  resolved: Omit<ResolvedScoreboard, "configSource">,
  source: "database" | "derived",
): ResolvedScoreboard {
  return { ...resolved, configSource: source };
}

export async function getScoreboardConfig(
  period = demo.CURRENT_PERIOD,
): Promise<{ config: ScoreboardConfigPayload | null; source: "database" | "derived" }> {
  if (!(await dbAvailable())) {
    return { config: null, source: "derived" };
  }
  const row = await prisma.executionScoreboardConfig.findUnique({ where: { period } });
  if (!row) return { config: null, source: "derived" };
  return {
    config: {
      wigObjectiveId: row.wigObjectiveId,
      leadingKrIds: row.leadingKrIds,
      laggingKrIds: row.laggingKrIds,
    },
    source: "database",
  };
}

export async function getResolvedScoreboard(
  opts: {
    diagnosis: StrategicDiagnosis;
    objectives: ObjectiveView[];
    allKrs: KeyResult[];
    derivedLeadingKrs: KeyResult[];
    period?: string;
  },
): Promise<ResolvedScoreboard> {
  const period = opts.period ?? demo.CURRENT_PERIOD;
  const stored = await getScoreboardConfig(period);
  const base =
    stored.config ?? buildDerivedScoreboardConfig(opts.derivedLeadingKrs);
  const resolved = resolveScoreboardView(base, opts);
  return mergeScoreboardSource(resolved, stored.source);
}

export async function saveScoreboardConfig(
  payload: ScoreboardConfigPayload,
  period = demo.CURRENT_PERIOD,
): Promise<ScoreboardConfigBundle> {
  if (!(await dbAvailable())) throw new Error("DATABASE_URL unset — 无法保存 4DX 记分板");
  const config = parseScoreboardConfig(payload);
  await prisma.executionScoreboardConfig.upsert({
    where: { period },
    create: {
      period,
      wigObjectiveId: config.wigObjectiveId,
      leadingKrIds: config.leadingKrIds,
      laggingKrIds: config.laggingKrIds,
    },
    update: {
      wigObjectiveId: config.wigObjectiveId,
      leadingKrIds: config.leadingKrIds,
      laggingKrIds: config.laggingKrIds,
    },
  });
  return { ...config, source: "database" };
}

export async function clearScoreboardConfig(period = demo.CURRENT_PERIOD): Promise<void> {
  if (!(await dbAvailable())) return;
  await prisma.executionScoreboardConfig.deleteMany({ where: { period } });
}
