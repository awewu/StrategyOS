import { CompetitorMatrix } from "@/components/market/CompetitorMatrix";
import { CompetitiveCube } from "@/components/market/CompetitiveCube";
import { HermesPanel } from "@/components/market/HermesPanel";
import { SignalFeed } from "@/components/market/SignalFeed";
import { BlindSpotPanel } from "@/components/market/BlindSpotPanel";
import { LeadingIndicatorPanel } from "@/components/market/LeadingIndicatorPanel";
import { MarketAskAiPanel, MarketBriefPanel } from "@/components/market/MarketBriefPanel";
import { MarketTabs } from "@/components/market/MarketTabs";
import { SwotPanel } from "@/components/market/SwotPanel";
import { GrowthAnalyticsEditor } from "@/components/growth/GrowthAnalyticsEditor";
import { getGrowthAnalytics } from "@/lib/fpa/growth-analytics-access";
import { PageHeader } from "@/components/ui/PageHeader";
import { buildMarketBrief } from "@/lib/market-intel/brief";
import { demoSources, demoSignals, demoTracks, demoInternalSwot } from "@/lib/market-intel/demo-data";
import { HERMES, runHermesScan, sourceHealth, blindSpots, rankSignals } from "@/lib/market-intel/hermes";
import { buildSwot, generateTows, internalSwotFromPremises } from "@/lib/market-intel/swot";
import { getMarketSelfScores } from "@/lib/market-intel/swot-access";
import { loadWorkbench } from "@/lib/market-intel/workbench-data";
import { getCompassBundle } from "@/lib/compass/data";
import { prisma } from "@/lib/db";
import type { IntelSource, IntelSignal, CompetitorTrack } from "@/lib/market-intel/types";
import { Suspense } from "react";

async function loadMarketData() {
  try {
    const [dbSources, dbSignals, dbTracks] = await Promise.all([
      prisma.intelSource.findMany({ where: { active: true }, orderBy: { competitor: "asc" } }),
      prisma.intelSignal.findMany({ orderBy: [{ relevance: "desc" }, { capturedAt: "desc" }] }),
      prisma.competitorTrack.findMany({ orderBy: { competitor: "asc" } }),
    ]);
    if (dbSources.length === 0) return null;
    const sources: IntelSource[] = dbSources.map((s) => ({
      id: s.id,
      competitor: s.competitor,
      kind: s.kind as IntelSource["kind"],
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
      impact: s.impact as IntelSignal["impact"],
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
    return { sources, signals, tracks };
  } catch {
    return null;
  }
}

export default async function MarketPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const initialTab =
    tab === "swot" || tab === "workbench" || tab === "intel" ? tab : "landscape";
  const now = new Date();
  const [db, workbench, compass, selfScoresBundle, growth] = await Promise.all([
    loadMarketData(),
    loadWorkbench(),
    getCompassBundle(),
    getMarketSelfScores(),
    getGrowthAnalytics(),
  ]);
  const sources = (db?.sources ?? demoSources).map((s) => ({ ...s, health: sourceHealth(s, now) }));
  const signals = db?.signals ?? demoSignals;
  const tracks = db?.tracks ?? demoTracks;
  const lastScan = runHermesScan(sources, signals, now);
  const spots = blindSpots(sources, now);
  const ranked = rankSignals(signals);
  const brief = buildMarketBrief(ranked, 3);
  const active = sources.filter((s) => s.health === "active").length;

  const landscapeView = (
    <div className="space-y-8">
      <CompetitorMatrix tracks={tracks} />
      <GrowthAnalyticsEditor
        initialAarrr={growth.aarrrFunnel}
        initialKeller={growth.kellerBrandLayers}
        source={growth.source}
      />
    </div>
  );

  const workbenchView = workbench ? (
    <div className="space-y-8">
      <CompetitiveCube data={workbench} />
      <CompetitorMatrix tracks={tracks} />
    </div>
  ) : (
    <div className="space-y-8">
      <p className="rounded-lg border border-dashed border-[var(--surface-border-strong)] p-6 text-sm text-[var(--color-text-muted)]">
        竞争研究工作台需要数据库支持。运行 db push + seed 后展示三维竞争立方体。下方仍可使用竞品矩阵。
      </p>
      <CompetitorMatrix tracks={tracks} />
    </div>
  );

  const momentumByEntity = Object.fromEntries(tracks.map((t) => [t.competitor, t.momentum]));
  const selfScores = selfScoresBundle.scores;
  // S/W 数据源：优先 /compass 战略前提派生，空时回退 demo 基线
  const premiseSwot = internalSwotFromPremises(compass.premises ?? []);
  const internalSwot = premiseSwot.length > 0 ? premiseSwot : demoInternalSwot;
  const swotSource = premiseSwot.length > 0 ? "战略罗盘前提" : "Demo 基线";
  const swotBoard = buildSwot(signals, internalSwot);
  const swotView = (
    <SwotPanel
      board={swotBoard}
      initialTows={generateTows(swotBoard, 2)}
      initialEngine="rule"
      signals={signals}
      internal={internalSwot}
      swotSource={swotSource}
      initialSelfScores={selfScores}
      momentumByEntity={momentumByEntity}
      selfScoresSource={selfScoresBundle.source}
    />
  );

  const intelView = (
    <div className="space-y-8">
      <HermesPanel
        agent={{ name: HERMES.name, role: HERMES.role }}
        lastScan={lastScan}
        sourcesActive={active}
        sourcesTotal={sources.length}
      />
      <LeadingIndicatorPanel signals={ranked} />
      <BlindSpotPanel blindSpots={spots} sources={sources} />
      <SignalFeed signals={ranked} />
    </div>
  );

  return (
    <div className="stratos-page">
      <PageHeader
        eyebrow="竞争情报 · Hermes"
        title="市场洞察"
        subtitle="简报 → 格局 → 深潜"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <MarketBriefPanel items={brief} />
        <MarketAskAiPanel signals={signals} />
      </div>

      <Suspense fallback={<div className="h-10 rounded-lg border border-dashed border-[var(--surface-border-strong)]" />}>
        <MarketTabs landscape={landscapeView} workbench={workbenchView} swot={swotView} intel={intelView} initialTab={initialTab} />
      </Suspense>
    </div>
  );
}
