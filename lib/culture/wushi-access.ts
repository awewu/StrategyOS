import { dbAvailable, prisma } from "@/lib/db";
import { getActivePeriod } from "@/lib/data/active-period";
import {
  defaultWushiAssessment,
  deriveQijiVerdicts,
  type QijiComparison,
  type QijiVerdict,
  type ReadinessStatus,
  type WushiAssessment,
  type WushiFactor,
} from "@/lib/culture/wushi";
import { demoSignals, demoTracks } from "@/lib/market-intel/demo-data";
import { getMarketSelfScores } from "@/lib/market-intel/swot-access";
import type { CompetitorTrack, IntelImpact, IntelSignal, IntelSource, SourceKind } from "@/lib/market-intel/types";

const INTERNAL_KEYS: string[] = ["dao", "jiang", "fa"];

function mergeWithDefaults(row: {
  rival: string | null;
  factorsJson: unknown;
  qijiJson: unknown;
}): WushiAssessment {
  const base = defaultWushiAssessment(row.rival ?? undefined);
  const storedFactors = Array.isArray(row.factorsJson)
    ? (row.factorsJson as WushiFactor[])
    : [];
  const storedQiji = Array.isArray(row.qijiJson)
    ? (row.qijiJson as QijiComparison[])
    : [];

  for (const f of base.factors) {
    if (INTERNAL_KEYS.includes(f.key)) {
      const sf = storedFactors.find((x) => x.key === f.key);
      if (sf) {
        f.status = sf.status as ReadinessStatus;
        f.note = sf.note ?? f.note;
      }
    }
  }

  for (const q of base.qiji) {
    const sq = storedQiji.find((x) => x.key === q.key);
    if (sq) {
      q.verdict = sq.verdict as QijiVerdict;
      q.note = sq.note ?? q.note;
    }
  }

  return base;
}

export async function getWushiAssessment(period?: string): Promise<{
  assessment: WushiAssessment;
  source: "database" | "demo";
}> {
  const activePeriod = period ?? (await getActivePeriod());
  const selfScores = (await getMarketSelfScores(activePeriod)).scores;
  const deriveFor = (signals: IntelSignal[], tracks: CompetitorTrack[], rival: string): QijiComparison[] =>
    deriveQijiVerdicts({ signals, tracks, selfScores, rival });

  if (!(await dbAvailable())) {
    const base = defaultWushiAssessment("史密斯");
    base.qiji = deriveFor(demoSignals, demoTracks, base.rival ?? "史密斯");
    return { assessment: base, source: "demo" };
  }
  try {
    const [row, dbSources, dbSignals, dbTracks] = await Promise.all([
      prisma.cultureWushiAssessment.findUnique({ where: { period: activePeriod } }),
      prisma.intelSource.findMany({ where: { active: true }, orderBy: { competitor: "asc" } }),
      prisma.intelSignal.findMany({ orderBy: [{ relevance: "desc" }, { capturedAt: "desc" }] }),
      prisma.competitorTrack.findMany({ orderBy: { competitor: "asc" } }),
    ]);
    const sources: IntelSource[] = dbSources.map((s) => ({
      id: s.id,
      competitor: s.competitor,
      kind: s.kind as SourceKind,
      url: s.url,
      cadenceDays: s.cadenceDays,
      lastScrapedAt: s.lastScrapedAt ? s.lastScrapedAt.toISOString().slice(0, 10) : null,
      health: s.health as IntelSource["health"],
    }));
    const signals: IntelSignal[] = dbSignals.map((s) => ({
      id: s.id,
      competitor: s.competitor,
      dimension: s.dimension as IntelSignal["dimension"],
      title: s.title,
      summary: s.summary,
      impact: s.impact as IntelImpact,
      relevance: s.relevance,
      sourceKind: sources.find((src) => src.id === s.sourceId)?.kind ?? "press",
      sourceLabel: s.sourceLabel,
      capturedAt: s.capturedAt.toISOString().slice(0, 10),
      linkedAssumptionCode: s.linkedAssumptionCode ?? undefined,
      linkedActionCode: s.linkedActionCode ?? undefined,
      verdict: (s.verdict as IntelSignal["verdict"]) ?? undefined,
      evidence: s.evidence ?? undefined,
    }));
    const tracks: CompetitorTrack[] = dbTracks.map((t) => ({
      competitor: t.competitor,
      product: t.product,
      gtm: t.gtm,
      brand: t.brand,
      strategy: t.strategy,
      momentum: t.momentum as CompetitorTrack["momentum"],
      momentumNote: t.momentumNote ?? "",
    }));
    const base = row ? mergeWithDefaults(row) : defaultWushiAssessment("史密斯");
    const rival = base.rival ?? "史密斯";
    base.qiji = deriveFor(signals, tracks, rival);
    return { assessment: base, source: row ? "database" : "demo" };
  } catch {
    const base = defaultWushiAssessment("史密斯");
    base.qiji = deriveFor(demoSignals, demoTracks, base.rival ?? "史密斯");
    return { assessment: base, source: "demo" };
  }
}

export async function saveWushiAssessment(
  assessment: WushiAssessment,
  period?: string,
): Promise<{ assessment: WushiAssessment; source: "database" }> {
  const activePeriod = period ?? (await getActivePeriod());
  if (!(await dbAvailable())) {
    throw new Error("DATABASE_URL unset — 无法保存五事评估");
  }

  const validStatuses: ReadinessStatus[] = ["ready", "partial", "gap"];
  const factorsJson = assessment.factors
    .filter((f) => INTERNAL_KEYS.includes(f.key))
    .map((f) => {
      if (!validStatuses.includes(f.status)) {
        throw new Error(`五事状态须为 ready / partial / gap`);
      }
      return {
        key: f.key,
        status: f.status,
        note: f.note?.trim() || null,
      };
    });

  const qijiJson = assessment.qiji.map((q) => ({
    key: q.key,
    verdict: q.verdict,
    note: q.note?.trim() || null,
  }));

  const row = await prisma.cultureWushiAssessment.upsert({
    where: { period: activePeriod },
    create: {
      period: activePeriod,
      rival: assessment.rival?.trim() || null,
      factorsJson,
      qijiJson,
    },
    update: {
      rival: assessment.rival?.trim() || null,
      factorsJson,
      qijiJson,
    },
  });

  return { assessment: mergeWithDefaults(row), source: "database" };
}
