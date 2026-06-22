import { dbAvailable, prisma } from "@/lib/db";
import {
  VALUES_AWARD_WINNERS,
  VALUES_UNDERSTANDING_RECORDS,
  type ValuesAwardWinner,
  type ValuesUnderstandingRecord,
} from "@/lib/culture/content";

async function seedCultureIfEmpty(): Promise<void> {
  const [awards, records] = await Promise.all([
    prisma.cultureAwardWinner.count(),
    prisma.cultureUnderstandingRecord.count(),
  ]);
  if (awards === 0) {
    await prisma.cultureAwardWinner.createMany({
      data: VALUES_AWARD_WINNERS.filter((w) => w.id !== "winner-placeholder").map((w, i) => ({
        year: w.year,
        period: w.period,
        awardName: w.awardName,
        winner: w.winner,
        unit: w.unit,
        citation: w.citation,
        sortOrder: i,
      })),
    });
  }
  if (records === 0) {
    await prisma.cultureUnderstandingRecord.createMany({
      data: VALUES_UNDERSTANDING_RECORDS.filter((r) => r.id !== "pub-placeholder").map((r, i) => ({
        date: r.date,
        title: r.title,
        unit: r.unit,
        author: r.author,
        summary: r.summary,
        relatedPrinciple: r.relatedPrinciple ?? null,
        sortOrder: i,
      })),
    });
  }
}

function mapAward(r: {
  id: string;
  year: number;
  period: string;
  awardName: string;
  winner: string;
  unit: string;
  citation: string;
}): ValuesAwardWinner {
  return {
    id: r.id,
    year: r.year,
    period: r.period,
    awardName: r.awardName,
    winner: r.winner,
    unit: r.unit,
    citation: r.citation,
  };
}

function mapRecord(r: {
  id: string;
  date: string;
  title: string;
  unit: string;
  author: string;
  summary: string;
  relatedPrinciple: string | null;
}): ValuesUnderstandingRecord {
  return {
    id: r.id,
    date: r.date,
    title: r.title,
    unit: r.unit,
    author: r.author,
    summary: r.summary,
    relatedPrinciple: r.relatedPrinciple ?? undefined,
  };
}

export async function getCultureAwards(): Promise<{
  winners: ValuesAwardWinner[];
  source: "database" | "demo";
}> {
  if (!(await dbAvailable())) {
    return { winners: VALUES_AWARD_WINNERS, source: "demo" };
  }
  try {
    await seedCultureIfEmpty();
    const rows = await prisma.cultureAwardWinner.findMany({ orderBy: [{ year: "desc" }, { sortOrder: "asc" }] });
    if (rows.length === 0) return { winners: VALUES_AWARD_WINNERS, source: "demo" };
    return { winners: rows.map(mapAward), source: "database" };
  } catch {
    return { winners: VALUES_AWARD_WINNERS, source: "demo" };
  }
}

export async function getCultureUnderstanding(): Promise<{
  records: ValuesUnderstandingRecord[];
  source: "database" | "demo";
}> {
  if (!(await dbAvailable())) {
    return { records: VALUES_UNDERSTANDING_RECORDS, source: "demo" };
  }
  try {
    await seedCultureIfEmpty();
    const rows = await prisma.cultureUnderstandingRecord.findMany({ orderBy: { sortOrder: "asc" } });
    if (rows.length === 0) return { records: VALUES_UNDERSTANDING_RECORDS, source: "demo" };
    return { records: rows.map(mapRecord), source: "database" };
  } catch {
    return { records: VALUES_UNDERSTANDING_RECORDS, source: "demo" };
  }
}

export async function saveCultureAward(
  payload: Omit<ValuesAwardWinner, "id"> & { id?: string },
): Promise<ValuesAwardWinner> {
  if (!(await dbAvailable())) throw new Error("DATABASE_URL unset — 无法保存文化公示");
  const data = {
    year: payload.year,
    period: payload.period.trim(),
    awardName: payload.awardName.trim(),
    winner: payload.winner.trim(),
    unit: payload.unit.trim(),
    citation: payload.citation.trim(),
  };
  if (payload.id) {
    const row = await prisma.cultureAwardWinner.update({ where: { id: payload.id }, data });
    return mapAward(row);
  }
  const row = await prisma.cultureAwardWinner.create({ data });
  return mapAward(row);
}

export async function deleteCultureAward(id: string): Promise<void> {
  if (!(await dbAvailable())) throw new Error("DATABASE_URL unset — 无法删除");
  await prisma.cultureAwardWinner.delete({ where: { id } });
}

export async function saveCultureUnderstanding(
  payload: Omit<ValuesUnderstandingRecord, "id"> & { id?: string },
): Promise<ValuesUnderstandingRecord> {
  if (!(await dbAvailable())) throw new Error("DATABASE_URL unset — 无法保存文化公示");
  const data = {
    date: payload.date.trim(),
    title: payload.title.trim(),
    unit: payload.unit.trim(),
    author: payload.author.trim(),
    summary: payload.summary.trim(),
    relatedPrinciple: payload.relatedPrinciple?.trim() || null,
  };
  if (payload.id) {
    const row = await prisma.cultureUnderstandingRecord.update({ where: { id: payload.id }, data });
    return mapRecord(row);
  }
  const row = await prisma.cultureUnderstandingRecord.create({ data });
  return mapRecord(row);
}

export async function deleteCultureUnderstanding(id: string): Promise<void> {
  if (!(await dbAvailable())) throw new Error("DATABASE_URL unset — 无法删除");
  await prisma.cultureUnderstandingRecord.delete({ where: { id } });
}
