import { asDbJson, dbAvailable, prisma, safeDbQuery } from "@/lib/db";
import * as demo from "@/lib/stratos-demo-data";
import type { TrafficLight } from "@/lib/types/stratos";
import { getActivePeriod } from "@/lib/data/active-period";

export type BscCard = {
  key: string;
  label: string;
  satisfaction: string;
  target: string;
  light: TrafficLight;
};

export type BscConfigBundle = {
  cards: BscCard[];
  source: "database" | "demo";
};

function defaultBscCards(): BscCard[] {
  return demo.bscCards.map((c) => ({ ...c }));
}

export function parseBscCardsJson(cardsJson: unknown): BscCard[] {
  const cards = cardsJson as BscCard[];
  if (!Array.isArray(cards) || cards.length === 0) {
    throw new Error("BSC 卡片数据格式无效");
  }
  return cards;
}

async function seedBscIfEmpty(period: string): Promise<void> {
  const existing = await prisma.strategicBscConfig.findUnique({ where: { period } });
  if (existing) return;
  await prisma.strategicBscConfig.create({
    data: { period, cardsJson: asDbJson(defaultBscCards()) },
  });
}

export async function getBscConfig(period?: string): Promise<BscConfigBundle> {
  const activePeriod = period ?? await getActivePeriod();
  const fallback = { cards: defaultBscCards(), source: "demo" as const };
  if (!(await dbAvailable())) return fallback;
  return safeDbQuery(async () => {
    await seedBscIfEmpty(activePeriod);
    const row = await prisma.strategicBscConfig.findUnique({ where: { period: activePeriod } });
    if (!row) return fallback;
    return { cards: parseBscCardsJson(row.cardsJson), source: "database" as const };
  }, fallback);
}

/** Merge persisted card copy with live health signals. */
export function mergeBscCardsWithLights(
  cards: BscCard[],
  lights: Record<"financial" | "customer" | "process" | "learning", TrafficLight>,
): BscCard[] {
  return cards.map((c) => ({
    ...c,
    light: lights[c.key as keyof typeof lights] ?? c.light,
  }));
}

export async function saveBscConfig(
  cards: BscCard[],
  period?: string,
): Promise<BscConfigBundle> {
  const activePeriod = period ?? await getActivePeriod();
  if (!(await dbAvailable())) throw new Error("DATABASE_URL unset — 无法保存 BSC 配置");
  if (cards.length === 0) throw new Error("BSC 卡片不能为空");
  for (const c of cards) {
    if (!c.key?.trim() || !c.label?.trim()) throw new Error("BSC 维度 key 与 label 不能为空");
  }
  await seedBscIfEmpty(activePeriod);
  const row = await prisma.strategicBscConfig.findUnique({ where: { period: activePeriod } });
  if (!row) throw new Error("BSC 配置记录未找到");
  await prisma.strategicBscConfig.update({
    where: { id: row.id },
    data: { cardsJson: asDbJson(cards) },
  });
  return { cards, source: "database" };
}
