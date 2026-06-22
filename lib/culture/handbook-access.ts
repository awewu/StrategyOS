import { asDbJson, dbAvailable, prisma, safeDbQuery } from "@/lib/db";
import {
  BEHAVIOR_GUIDELINES,
  CORE_VALUES_INTRO,
  FOUR_SATISFACTION_PILLARS,
  type CultureHandbookContent,
} from "@/lib/culture/content";
import { DOCTRINES } from "@/lib/constants";
import { getActivePeriod } from "@/lib/data/active-period";

export type CultureHandbookBundle = {
  handbook: CultureHandbookContent;
  source: "database" | "demo";
};

function defaultHandbook(): CultureHandbookContent {
  return {
    doctrines: DOCTRINES.map((d) => ({ ...d })),
    fourSatisfactionPillars: [...FOUR_SATISFACTION_PILLARS],
    coreValuesIntro: {
      headline: CORE_VALUES_INTRO.headline,
      body: CORE_VALUES_INTRO.body,
      principles: [...CORE_VALUES_INTRO.principles],
      decisionTest: CORE_VALUES_INTRO.decisionTest,
    },
    behaviorGuidelines: BEHAVIOR_GUIDELINES.map((g) => ({
      id: g.id,
      title: g.title,
      items: [...g.items],
    })),
  };
}

export function parseCultureHandbookJson(contentJson: unknown): CultureHandbookContent {
  const c = contentJson as CultureHandbookContent;
  if (
    !c ||
    !Array.isArray(c.doctrines) ||
    !Array.isArray(c.fourSatisfactionPillars) ||
    !c.coreValuesIntro ||
    !Array.isArray(c.behaviorGuidelines)
  ) {
    throw new Error("文化手册数据格式无效");
  }
  return c;
}

async function seedHandbookIfEmpty(period: string): Promise<void> {
  const existing = await prisma.cultureHandbook.findUnique({ where: { period } });
  if (existing) return;
  await prisma.cultureHandbook.create({
    data: { period, contentJson: asDbJson(defaultHandbook()) },
  });
}

export async function getCultureHandbook(period?: string): Promise<CultureHandbookBundle> {
  const activePeriod = period ?? await getActivePeriod();
  const fallback = { handbook: defaultHandbook(), source: "demo" as const };
  if (!(await dbAvailable())) return fallback;
  return safeDbQuery(async () => {
    await seedHandbookIfEmpty(activePeriod);
    const row = await prisma.cultureHandbook.findUnique({ where: { period: activePeriod } });
    if (!row) return fallback;
    return { handbook: parseCultureHandbookJson(row.contentJson), source: "database" as const };
  }, fallback);
}

export async function saveCultureHandbook(
  handbook: CultureHandbookContent,
  period?: string,
): Promise<CultureHandbookBundle> {
  const activePeriod = period ?? await getActivePeriod();
  if (!(await dbAvailable())) throw new Error("DATABASE_URL unset — 无法保存文化手册");
  await seedHandbookIfEmpty(activePeriod);
  const row = await prisma.cultureHandbook.findUnique({ where: { period: activePeriod } });
  if (!row) throw new Error("文化手册记录未找到");

  if (handbook.doctrines.length === 0) throw new Error("三大信条不能为空");
  if (handbook.fourSatisfactionPillars.length === 0) throw new Error("四个满意支柱不能为空");
  if (handbook.behaviorGuidelines.length === 0) throw new Error("六项基本原则不能为空");

  await prisma.cultureHandbook.update({
    where: { id: row.id },
    data: { contentJson: asDbJson(handbook) },
  });
  return { handbook, source: "database" };
}
