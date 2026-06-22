import { asDbJson, dbAvailable, prisma, safeDbQuery } from "@/lib/db";
import { Prisma } from "@prisma/client";
import type { TimelineMilestone } from "@/lib/command/timeline";
import type { DecisionItem } from "@/lib/panorama/scr";
import * as demo from "@/lib/stratos-demo-data";

export type CommandDecisionsBundle = {
  decisions: DecisionItem[];
  source: "database" | "derived";
};

export type CommandTimelineBundle = {
  milestones: TimelineMilestone[];
  source: "database" | "derived";
};

const TIMELINE_KINDS = new Set<TimelineMilestone["kind"]>(["snapshot", "meeting", "gate"]);
const TIMELINE_STATUSES = new Set<TimelineMilestone["status"]>(["done", "active", "upcoming"]);

export function parseDecisionsJson(json: unknown): DecisionItem[] {
  const items = json as DecisionItem[];
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("待决事项数据格式无效");
  }
  for (const d of items) {
    if (!d.id?.trim() || !d.title?.trim()) throw new Error("待决事项 id 与标题不能为空");
  }
  return items;
}

export function parseTimelineJson(json: unknown): TimelineMilestone[] {
  const items = json as TimelineMilestone[];
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("战略时间轴数据格式无效");
  }
  for (const m of items) {
    if (!m.id?.trim() || !m.label?.trim() || !m.period?.trim()) {
      throw new Error("时间轴里程碑 id、标签与期间不能为空");
    }
    if (!TIMELINE_KINDS.has(m.kind)) throw new Error("时间轴里程碑类型无效");
    if (!TIMELINE_STATUSES.has(m.status)) throw new Error("时间轴里程碑状态无效");
  }
  return items;
}

async function deleteRowIfEmpty(period: string) {
  const row = await prisma.strategicCommandConfig.findUnique({ where: { period } });
  if (!row) return;
  if (row.decisionsJson == null && row.timelineJson == null) {
    await prisma.strategicCommandConfig.deleteMany({ where: { period } });
  }
}

export async function getCommandDecisionsConfig(
  period = demo.CURRENT_PERIOD,
): Promise<{ decisions: DecisionItem[] | null; source: "database" | "derived" }> {
  const fallback = { decisions: null, source: "derived" as const };
  if (!(await dbAvailable())) return fallback;
  return safeDbQuery(async () => {
    const row = await prisma.strategicCommandConfig.findUnique({ where: { period } });
    if (!row?.decisionsJson) return fallback;
    return { decisions: parseDecisionsJson(row.decisionsJson), source: "database" as const };
  }, fallback);
}

export async function getCommandTimelineConfig(
  period = demo.CURRENT_PERIOD,
): Promise<{ milestones: TimelineMilestone[] | null; source: "database" | "derived" }> {
  const fallback = { milestones: null, source: "derived" as const };
  if (!(await dbAvailable())) return fallback;
  return safeDbQuery(async () => {
    const row = await prisma.strategicCommandConfig.findUnique({ where: { period } });
    if (!row?.timelineJson) return fallback;
    return { milestones: parseTimelineJson(row.timelineJson), source: "database" as const };
  }, fallback);
}

export async function saveCommandDecisions(
  decisions: DecisionItem[],
  period = demo.CURRENT_PERIOD,
): Promise<CommandDecisionsBundle> {
  if (!(await dbAvailable())) throw new Error("DATABASE_URL unset — 无法保存待决事项");
  if (decisions.length === 0) throw new Error("待决事项不能为空");
  await prisma.strategicCommandConfig.upsert({
    where: { period },
    create: { period, decisionsJson: asDbJson(decisions) },
    update: { decisionsJson: asDbJson(decisions) },
  });
  return { decisions, source: "database" };
}

export async function saveCommandTimeline(
  milestones: TimelineMilestone[],
  period = demo.CURRENT_PERIOD,
): Promise<CommandTimelineBundle> {
  if (!(await dbAvailable())) throw new Error("DATABASE_URL unset — 无法保存战略时间轴");
  if (milestones.length === 0) throw new Error("战略时间轴不能为空");
  await prisma.strategicCommandConfig.upsert({
    where: { period },
    create: { period, timelineJson: asDbJson(milestones) },
    update: { timelineJson: asDbJson(milestones) },
  });
  return { milestones, source: "database" };
}

export async function clearCommandDecisions(period = demo.CURRENT_PERIOD): Promise<void> {
  if (!(await dbAvailable())) return;
  const row = await prisma.strategicCommandConfig.findUnique({ where: { period } });
  if (!row?.decisionsJson) return;
  await prisma.strategicCommandConfig.update({
    where: { period },
    data: { decisionsJson: Prisma.DbNull },
  });
  await deleteRowIfEmpty(period);
}

export async function clearCommandTimeline(period = demo.CURRENT_PERIOD): Promise<void> {
  if (!(await dbAvailable())) return;
  const row = await prisma.strategicCommandConfig.findUnique({ where: { period } });
  if (!row?.timelineJson) return;
  await prisma.strategicCommandConfig.update({
    where: { period },
    data: { timelineJson: Prisma.DbNull },
  });
  await deleteRowIfEmpty(period);
}
