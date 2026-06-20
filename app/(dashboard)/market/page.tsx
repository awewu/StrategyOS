import { HermesPanel } from "@/components/market/HermesPanel";
import { CompetitorMatrix } from "@/components/market/CompetitorMatrix";
import { SignalFeed } from "@/components/market/SignalFeed";
import { BlindSpotPanel } from "@/components/market/BlindSpotPanel";
import { HERMES, runHermesScan, sourceHealth, blindSpots, rankSignals } from "@/lib/market-intel/hermes";
import { demoSources, demoSignals, demoTracks } from "@/lib/market-intel/demo-data";
import { prisma } from "@/lib/db";
import type { IntelSource, IntelSignal, CompetitorTrack } from "@/lib/market-intel/types";

async function loadMarketData() {
  try {
    const [dbSources, dbSignals, dbTracks] = await Promise.all([
      prisma.intelSource.findMany({ where: { active: true }, orderBy: { competitor: "asc" } }),
      prisma.intelSignal.findMany({ orderBy: [{ relevance: "desc" }, { capturedAt: "desc" }] }),
      prisma.competitorTrack.findMany({ orderBy: { competitor: "asc" } }),
    ]);
    if (dbSources.length === 0) return null;

    const sources: IntelSource[] = dbSources.map((s) => ({
      id: s.id, competitor: s.competitor, kind: s.kind as IntelSource["kind"],
      url: s.url, cadenceDays: s.cadenceDays,
      lastScrapedAt: s.lastScrapedAt ? s.lastScrapedAt.toISOString().slice(0, 10) : null,
      health: s.health as IntelSource["health"],
    }));
    const signals: IntelSignal[] = dbSignals.map((s) => ({
      id: s.id, competitor: s.competitor, dimension: s.dimension as IntelSignal["dimension"],
      title: s.title, summary: s.summary, impact: s.impact as IntelSignal["impact"],
      relevance: s.relevance,
      sourceKind: sources.find((src) => src.id === s.sourceId)?.kind ?? "press",
      sourceLabel: s.sourceLabel, capturedAt: s.capturedAt.toISOString().slice(0, 10),
      linkedAssumptionCode: s.linkedAssumptionCode ?? undefined,
      linkedActionCode: s.linkedActionCode ?? undefined,
    }));
    const tracks: CompetitorTrack[] = dbTracks.map((t) => ({
      competitor: t.competitor, product: t.product, gtm: t.gtm, brand: t.brand, strategy: t.strategy,
      momentum: t.momentum as CompetitorTrack["momentum"], momentumNote: t.momentumNote ?? "",
    }));
    return { sources, signals, tracks };
  } catch {
    return null;
  }
}

export default async function MarketPage() {
  const now = new Date();
  const db = await loadMarketData();
  const sources = (db?.sources ?? demoSources).map((s) => ({ ...s, health: sourceHealth(s, now) }));
  const signals = db?.signals ?? demoSignals;
  const tracks = db?.tracks ?? demoTracks;
  const lastScan = runHermesScan(sources, signals, now);
  const spots = blindSpots(sources, now);
  const ranked = rankSignals(signals);
  const active = sources.filter((s) => s.health === "active").length;
  const dataSource = db ? "DB" : "Demo";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">市场洞察</h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          Hermes 持续追踪 · 产品 / GTM / 品牌 / 战略模式 · {sources.length} 个来源 · 数据源 {dataSource}
        </p>
      </div>

      <HermesPanel
        agent={{ name: HERMES.name, role: HERMES.role }}
        lastScan={lastScan}
        sourcesActive={active}
        sourcesTotal={sources.length}
      />

      <BlindSpotPanel blindSpots={spots} sources={sources} />

      <CompetitorMatrix tracks={tracks} />

      <SignalFeed signals={ranked} />
    </div>
  );
}
