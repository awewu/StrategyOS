import { NextResponse } from "next/server";
import { logUsageEvent } from "@/lib/audit/log-event";
import { runHermesScan, HERMES, sourceHealth, blindSpots } from "@/lib/market-intel/hermes";
import { demoSignals, demoSources } from "@/lib/market-intel/demo-data";
import { prisma } from "@/lib/db";
import type { IntelSource, IntelSignal } from "@/lib/market-intel/types";
import { scanSource, hermesLlmConfigured } from "@/lib/market-intel/hermes-llm";

export const runtime = "nodejs";

async function loadFromDb(): Promise<{ sources: IntelSource[]; signals: IntelSignal[] } | null> {
  try {
    const [dbSources, dbSignals] = await Promise.all([
      prisma.intelSource.findMany({ where: { active: true } }),
      prisma.intelSignal.findMany({ orderBy: { capturedAt: "desc" } }),
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
    return { sources, signals };
  } catch { return null; }
}

export async function POST(request: Request) {
  const now = new Date();
  const db = await loadFromDb();
  const sources = (db?.sources ?? demoSources).map((s) => ({ ...s, health: sourceHealth(s, now) }));
  let signals = db?.signals ?? demoSignals;
  const fetchLog: string[] = [];
  let newSignalsWritten = 0;

  if (db && hermesLlmConfigured()) {
    // Scan sources that are due, write new signals
    const dueSources = sources.filter(
      (s) => Date.now() - (s.lastScrapedAt ? new Date(s.lastScrapedAt).getTime() : 0) >= s.cadenceDays * 86_400_000
    );
    const results = await Promise.all(dueSources.map((s) => scanSource(s, now)));
    for (const r of results) {
      fetchLog.push(r.competitor + ": " + (r.error ?? r.newSignals.length + " 条新信号"));
      if (!r.fetched || r.newSignals.length === 0) continue;
      for (const sig of r.newSignals) {
        await prisma.intelSignal.upsert({
          where: { id: sig.id },
          update: {},
          create: {
            id: sig.id, sourceId: r.sourceId, competitor: sig.competitor,
            dimension: sig.dimension, title: sig.title, summary: sig.summary,
            impact: sig.impact, relevance: sig.relevance,
            sourceLabel: sig.sourceLabel, capturedAt: now,
          },
        }).catch(() => {});
        newSignalsWritten++;
      }
      await prisma.intelSource.update({
        where: { id: r.sourceId },
        data: { lastScrapedAt: now, health: "active" },
      }).catch(() => {});
    }
    const refreshed = await loadFromDb().catch(() => null);
    if (refreshed) signals = refreshed.signals;
  } else if (db) {
    await Promise.all(
      sources.map((s) => prisma.intelSource.update({ where: { id: s.id }, data: { health: s.health } }))
    ).catch(() => {});
  }

  const engine: "llm" | "rule" = hermesLlmConfigured() ? "llm" : "rule";
  const base = runHermesScan(sources, signals, now);
  const result = { ...base, llmEngine: engine, newSignals: newSignalsWritten || base.newSignals };

  await logUsageEvent({
    action: "hermes_scan", resource: result.scanId, request,
    metadata: { sourcesScanned: result.sourcesScanned, newSignals: result.newSignals, engine },
  });

  return NextResponse.json({ ...result, blindSpots: blindSpots(sources, now), fetchLog, source: db ? "db" : "demo" });
}

export async function GET() {
  const now = new Date();
  const db = await loadFromDb();
  const sources = (db?.sources ?? demoSources).map((s) => ({ ...s, health: sourceHealth(s, now) }));
  return NextResponse.json({ agent: HERMES, sources, llmEnabled: hermesLlmConfigured(), source: db ? "db" : "demo" });
}
