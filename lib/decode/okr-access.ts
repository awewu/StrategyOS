import { dbAvailable, prisma } from "@/lib/db";
import { getActivePeriod } from "@/lib/data/active-period";
import type { OkrObjective } from "@/lib/decode/okr";

export type OkrBundle = {
  objectives: OkrObjective[];
  source: "database" | "demo";
};

/** Demo fallback：与 stratos-demo-data 的 objectives/KRs 保持一致的口径 */
const DEMO_OKR: OkrObjective[] = [
  {
    id: "obj-wig",
    title: "V4 热泵平台化 · 样机到量产",
    intent: "创新曲线的年度主攻：平台冻结 + 首批渠道",
    ownerName: "热水 BU",
    hoshinEntryId: null,
    hoshinLabel: "西 · 年度突破 / V4 平台化",
    sortOrder: 0,
    keyResults: [
      {
        id: "kr-lead-1",
        title: "V4 样机测试通过率",
        baselineValue: "0",
        targetValue: "100",
        currentValue: "72",
        unit: "%",
        confidence: 0.7,
        isLeadingIndicator: true,
        commitmentCount: 2,
      },
      {
        id: "kr-lead-2",
        title: "首批签约渠道",
        baselineValue: "0",
        targetValue: "50",
        currentValue: "18",
        unit: "家",
        confidence: 0.6,
        isLeadingIndicator: true,
        commitmentCount: 1,
      },
    ],
  },
  {
    id: "obj-channel",
    title: "华东渠道新签规模化",
    intent: "增长曲线主攻：华东模式跑通后复制华南",
    ownerName: "王芳",
    hoshinEntryId: null,
    hoshinLabel: "西 · 年度突破 / O1 增长",
    sortOrder: 1,
    keyResults: [
      {
        id: "kr-lag-1",
        title: "酒店段新签",
        baselineValue: "120",
        targetValue: "500",
        currentValue: "265",
        unit: "家",
        confidence: 0.65,
        isLeadingIndicator: false,
        commitmentCount: 1,
      },
    ],
  },
];

export async function getOkrBundle(): Promise<OkrBundle> {
  if (!(await dbAvailable())) return { objectives: DEMO_OKR, source: "demo" };
  const period = await getActivePeriod();
  const [rows, hoshinRows] = await Promise.all([
    prisma.objective.findMany({
      where: { period },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: {
        keyResults: {
          orderBy: { title: "asc" },
          include: { _count: { select: { commitments: true } } },
        },
      },
    }),
    prisma.decodeHoshinEntry.findMany({ where: { period } }),
  ]);
  if (rows.length === 0) return { objectives: DEMO_OKR, source: "demo" };

  const hoshinById = new Map(hoshinRows.map((h) => [h.id, `${h.rowLabel} / ${h.label}`]));
  return {
    source: "database",
    objectives: rows.map((o) => ({
      id: o.id,
      title: o.title,
      intent: o.intent,
      ownerName: o.ownerName,
      hoshinEntryId: o.hoshinEntryId,
      hoshinLabel: o.hoshinEntryId ? (hoshinById.get(o.hoshinEntryId) ?? null) : null,
      sortOrder: o.sortOrder,
      keyResults: o.keyResults.map((kr) => ({
        id: kr.id,
        title: kr.title,
        baselineValue: kr.baselineValue,
        targetValue: kr.targetValue,
        currentValue: kr.currentValue,
        unit: kr.unit,
        confidence: kr.confidence == null ? null : Number(kr.confidence),
        isLeadingIndicator: kr.isLeadingIndicator,
        commitmentCount: kr._count.commitments,
      })),
    })),
  };
}

export type SaveOkrPayload = {
  objectives: {
    id?: string;
    title: string;
    intent?: string | null;
    ownerName?: string | null;
    hoshinEntryId?: string | null;
    keyResults: {
      id?: string;
      title: string;
      baselineValue?: string | null;
      targetValue?: string | null;
      currentValue?: string | null;
      unit?: string | null;
      isLeadingIndicator?: boolean;
    }[];
  }[];
};

/** 全量替换当期 OKR（O 少而精，全量语义比增量简单且安全） */
export async function saveOkr(payload: SaveOkrPayload): Promise<OkrBundle> {
  for (const o of payload.objectives) {
    if (!o.title?.trim()) throw new Error("Objective 标题不能为空");
    if (o.keyResults.length === 0) throw new Error(`「${o.title}」至少需要一条 KR`);
    for (const kr of o.keyResults) {
      if (!kr.title?.trim()) throw new Error("KR 标题不能为空");
    }
  }
  if (payload.objectives.length > 5) throw new Error("O 最多 5 个 — OKR 的灵魂是聚焦");

  const period = await getActivePeriod();
  await prisma.$transaction(async (tx) => {
    const keepObjIds = payload.objectives.map((o) => o.id).filter(Boolean) as string[];
    await tx.objective.deleteMany({ where: { period, id: { notIn: keepObjIds } } });

    for (const [i, o] of payload.objectives.entries()) {
      const data = {
        period,
        title: o.title.trim(),
        intent: o.intent?.trim() || null,
        ownerName: o.ownerName?.trim() || null,
        hoshinEntryId: o.hoshinEntryId || null,
        sortOrder: i,
      };
      const obj = o.id
        ? await tx.objective.update({ where: { id: o.id }, data })
        : await tx.objective.create({ data });

      const keepKrIds = o.keyResults.map((kr) => kr.id).filter(Boolean) as string[];
      await tx.keyResult.deleteMany({
        where: { objectiveId: obj.id, id: { notIn: keepKrIds } },
      });
      for (const kr of o.keyResults) {
        const krData = {
          period,
          title: kr.title.trim(),
          baselineValue: kr.baselineValue?.trim() || null,
          targetValue: kr.targetValue?.trim() || null,
          currentValue: kr.currentValue?.trim() || null,
          unit: kr.unit?.trim() || null,
          isLeadingIndicator: kr.isLeadingIndicator ?? true,
        };
        if (kr.id) {
          await tx.keyResult.update({ where: { id: kr.id }, data: krData });
        } else {
          await tx.keyResult.create({ data: { ...krData, objectiveId: obj.id } });
        }
      }
    }
  });
  return getOkrBundle();
}

/** 从 X-Matrix 年度突破生成 OKR 草稿（承接链：西象限条目 → O） */
export async function draftOkrFromHoshin(): Promise<SaveOkrPayload> {
  const period = await getActivePeriod();
  const entries = await prisma.decodeHoshinEntry.findMany({
    where: { period, rowLabel: { contains: "年度突破" } },
    orderBy: { sortOrder: "asc" },
  });
  return {
    objectives: entries.slice(0, 5).map((e) => ({
      title: e.label,
      intent: e.action || null,
      ownerName: e.owner || null,
      hoshinEntryId: e.id,
      keyResults: [
        {
          title: e.okr || `${e.label} 关键成果`,
          baselineValue: null,
          targetValue: null,
          currentValue: null,
          isLeadingIndicator: true,
        },
      ],
    })),
  };
}
