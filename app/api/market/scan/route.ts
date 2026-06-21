import { NextResponse } from "next/server";
import { logUsageEvent } from "@/lib/audit/log-event";
import { runHermesScan, HERMES, sourceHealth, blindSpots } from "@/lib/market-intel/hermes";
import { demoSignals, demoSources } from "@/lib/market-intel/demo-data";
import { prisma } from "@/lib/db";
import type { IntelSource, IntelSignal } from "@/lib/market-intel/types";
import { hermesLlmConfigured } from "@/lib/market-intel/hermes-llm";
import { runHermesPipeline } from "@/lib/market-intel/hermes-pipeline";

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
      verdict: (s.verdict as IntelSignal["verdict"]) ?? undefined,
      evidence: s.evidence ?? undefined,
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
  let curation: { kept: number; drops: number; rounds: number; trace: { node: string; competitor: string; detail: string }[]; dropList: { competitor: string; dimension: string; title: string; reason: string }[] } | null = null;

  if (db && hermesLlmConfigured()) {
    // Multi-agent pipeline: collect → analyze → qc(grounding) → decide.
    // Only signals with verified evidence quotes are persisted; the curator's
    // dropped (unsupported) signals are surfaced separately, never hidden.
    const pipeline = await runHermesPipeline(sources, { now });
    const sourceIdByCompetitor = new Map<string, string>();
    for (const s of sources) if (!sourceIdByCompetitor.has(s.competitor)) sourceIdByCompetitor.set(s.competitor, s.id);
    for (const sig of pipeline.kept) {
      const sourceId = sourceIdByCompetitor.get(sig.competitor);
      if (!sourceId) continue;
      await prisma.intelSignal.upsert({
        where: { id: sig.id },
        update: { verdict: sig.verdict ?? "supported", evidence: sig.evidence ?? null },
        create: {
          id: sig.id, sourceId, competitor: sig.competitor,
          dimension: sig.dimension, title: sig.title, summary: sig.summary,
          impact: sig.impact, relevance: sig.relevance,
          sourceLabel: sig.sourceLabel, capturedAt: now,
          verdict: sig.verdict ?? "supported", evidence: sig.evidence ?? null,
        },
      }).catch(() => {});
      newSignalsWritten++;
    }
    // Mark scanned sources fresh
    const scannedCompetitors = new Set(pipeline.trace.filter((t) => t.node === "collect").map((t) => t.competitor));
    for (const s of sources) {
      if (!scannedCompetitors.has(s.competitor)) continue;
      await prisma.intelSource.update({
        where: { id: s.id }, data: { lastScrapedAt: now, health: "active" },
      }).catch(() => {});
    }
    for (const t of pipeline.trace) fetchLog.push(`[${t.node}] ${t.competitor}: ${t.detail}`);
    curation = {
      kept: pipeline.kept.length,
      drops: pipeline.drops.length,
      rounds: pipeline.rounds,
      trace: pipeline.trace,
      dropList: pipeline.drops,
    };
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
    metadata: { sourcesScanned: result.sourcesScanned, newSignals: result.newSignals, engine, drops: curation?.drops ?? 0 },
  });

  return NextResponse.json({ ...result, blindSpots: blindSpots(sources, now), fetchLog, curation, source: db ? "db" : "demo" });
}

export async function GET() {
  const now = new Date();
  const db = await loadFromDb();
  const sources = (db?.sources ?? demoSources).map((s) => ({ ...s, health: sourceHealth(s, now) }));
  return NextResponse.json({ agent: HERMES, sources, llmEnabled: hermesLlmConfigured(), source: db ? "db" : "demo" });
}
