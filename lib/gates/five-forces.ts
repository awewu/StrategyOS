import { dbAvailable, prisma } from "@/lib/db";
import { getActivePeriod } from "@/lib/data/active-period";
import type { FiveForce, ThreatLevel } from "@prisma/client";

export type { FiveForce, ThreatLevel };

export interface FiveForceRecord {
  id: string;
  period: string;
  force: FiveForce;
  label: string;
  plain: string;
  threatLevel: ThreatLevel;
  evidence: string | null;
  linkedAssumptionCode: string | null;
  owner: string | null;
  mitigated: boolean;
  note: string | null;
  updatedAt?: Date;
}

export const FORCE_DEFINITIONS: {
  force: FiveForce;
  label: string;
  plain: string;
}[] = [
  {
    force: "existing_rivalry",
    label: "同行内卷",
    plain: "我们和主要对手在产品、GTM、品牌、战略上是领先、打平还是落后？",
  },
  {
    force: "new_entrants",
    label: "新玩家入局",
    plain: "谁可能携资本、技术或生态冲进战场，把我们的优势降维成基础设施？",
  },
  {
    force: "substitutes",
    label: "替代品替代",
    plain: "客户解决同一需求的方式是不是正在变？（例如新渠道、新生态、新技术路线）",
  },
  {
    force: "supplier_power",
    label: "上游卡脖子",
    plain: "关键零部件、核心技术、稀缺人才、核心渠道是否被少数供应商控制？",
  },
  {
    force: "buyer_power",
    label: "下游压价",
    plain: "客户/渠道有没有选择、有话语权？我们是否被大客户或单一渠道绑架？",
  },
];

const DEFAULT_LEVELS: Record<FiveForce, ThreatLevel> = {
  existing_rivalry: "high",
  new_entrants: "medium",
  substitutes: "medium",
  supplier_power: "low",
  buyer_power: "medium",
};

function toRecord(row: {
  id: string;
  period: string;
  force: FiveForce;
  threatLevel: ThreatLevel;
  evidence: string | null;
  linkedAssumptionCode: string | null;
  owner: string | null;
  mitigated: boolean;
  note: string | null;
  updatedAt: Date;
}): FiveForceRecord {
  const def = FORCE_DEFINITIONS.find((d) => d.force === row.force)!;
  return {
    id: row.id,
    period: row.period,
    force: row.force,
    label: def.label,
    plain: def.plain,
    threatLevel: row.threatLevel,
    evidence: row.evidence,
    linkedAssumptionCode: row.linkedAssumptionCode,
    owner: row.owner,
    mitigated: row.mitigated,
    note: row.note,
    updatedAt: row.updatedAt,
  };
}

function demoRecords(period: string): FiveForceRecord[] {
  return FORCE_DEFINITIONS.map((d) => ({
    id: `demo-${d.force}`,
    period,
    force: d.force,
    label: d.label,
    plain: d.plain,
    threatLevel: DEFAULT_LEVELS[d.force],
    evidence: null,
    linkedAssumptionCode: null,
    owner: null,
    mitigated: false,
    note: null,
  }));
}

export async function getFiveForceRecords(period?: string): Promise<{
  records: FiveForceRecord[];
  source: "database" | "demo";
}> {
  const activePeriod = period ?? (await getActivePeriod());
  if (!(await dbAvailable())) {
    return { records: demoRecords(activePeriod), source: "demo" };
  }
  try {
    const count = await prisma.gateFiveForceRecord.count({ where: { period: activePeriod } });
    if (count === 0) {
      await prisma.gateFiveForceRecord.createMany({
        data: FORCE_DEFINITIONS.map((d) => ({
          period: activePeriod,
          force: d.force,
          threatLevel: DEFAULT_LEVELS[d.force],
          evidence: null,
          linkedAssumptionCode: null,
          owner: null,
          mitigated: false,
          note: null,
        })),
      });
    }
    const rows = await prisma.gateFiveForceRecord.findMany({
      where: { period: activePeriod },
      orderBy: { force: "asc" },
    });
    return { records: rows.map(toRecord), source: "database" };
  } catch {
    return { records: demoRecords(activePeriod), source: "demo" };
  }
}

export async function saveFiveForceRecord(
  record: Pick<
    FiveForceRecord,
    "force" | "threatLevel" | "evidence" | "linkedAssumptionCode" | "owner" | "mitigated" | "note"
  >,
  period?: string,
): Promise<{ record: FiveForceRecord; source: "database" }> {
  const activePeriod = period ?? (await getActivePeriod());
  if (!(await dbAvailable())) {
    throw new Error("DATABASE_URL unset — 无法保存五力记录");
  }

  const row = await prisma.gateFiveForceRecord.upsert({
    where: { period_force: { period: activePeriod, force: record.force } },
    create: {
      period: activePeriod,
      force: record.force,
      threatLevel: record.threatLevel,
      evidence: record.evidence?.trim() || null,
      linkedAssumptionCode: record.linkedAssumptionCode?.trim() || null,
      owner: record.owner?.trim() || null,
      mitigated: record.mitigated,
      note: record.note?.trim() || null,
    },
    update: {
      threatLevel: record.threatLevel,
      evidence: record.evidence?.trim() || null,
      linkedAssumptionCode: record.linkedAssumptionCode?.trim() || null,
      owner: record.owner?.trim() || null,
      mitigated: record.mitigated,
      note: record.note?.trim() || null,
    },
  });

  return { record: toRecord(row), source: "database" };
}
