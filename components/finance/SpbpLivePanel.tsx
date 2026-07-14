"use client";

import { useState } from "react";
import type { Scenario } from "@/lib/types/stratos";
import { weightedRunway } from "@/lib/stratos/spbp-bayes";
import { SectionCard } from "@/components/ui/KpiTile";

export function SpbpLivePanel({ initialScenarios }: { initialScenarios: Scenario[] }) {
  const [scenarios, setScenarios] = useState(initialScenarios);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function applyEvidence(type: "optimistic" | "pessimistic" | "reset") {
    setLoading(true);
    setNote(null);
    try {
      if (type === "reset") {
        setScenarios(initialScenarios);
        setNote("已重置为页面加载时概率");
        return;
      }
      const res = await fetch("/api/spbp/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          favorsOptimistic: type === "optimistic",
          favorsPessimistic: type === "pessimistic",
          strength: 0.12,
        }),
      });
      const data = (await res.json()) as { scenarios: Scenario[]; source: string };
      setScenarios(data.scenarios);
      setNote(`贝叶斯式更新 · 数据源 ${data.source}`);
    } finally {
      setLoading(false);
    }
  }

  const weightedRev = scenarios.reduce(
    (s, sc) => s + sc.fpaImpact.revenue * (sc.probability / 100),
    0
  );
  const wr = weightedRunway(scenarios);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => applyEvidence("pessimistic")}
          className="rounded border border-[color-mix(in_srgb,var(--signal-red)_40%,transparent)] px-3 py-1.5 text-xs text-[var(--fpa-kpi-negative)] hover:bg-[color-mix(in_srgb,var(--signal-red)_10%,transparent)] disabled:opacity-50"
        >
          Q2 证据偏悲观
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => applyEvidence("optimistic")}
          className="rounded border border-[var(--signal-green)]/25 px-3 py-1.5 text-xs text-[var(--signal-green)] hover:bg-[var(--signal-green)]/10 disabled:opacity-50"
        >
          Q2 证据偏乐观
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => applyEvidence("reset")}
          className="rounded border border-[var(--surface-border)] px-3 py-1.5 text-xs text-[var(--color-text-muted)] hover:bg-black/[0.04] disabled:opacity-50"
        >
          重置
        </button>
        {note && <span className="text-xs text-[var(--color-text-muted)]">{note}</span>}
      </div>

      <SectionCard
        title="概率分布 · Live"
        subtitle={`加权期望 · 营收 ${Math.round(weightedRev)} 万 · runway ${wr.toFixed(1)} 月`}
        accent="gold"
        dense
      >
        <div className="flex h-3 overflow-hidden rounded-full">
          {scenarios.map((sc) => (
            <div
              key={sc.id}
              className="h-full"
              style={{
                width: `${sc.probability}%`,
                backgroundColor:
                  sc.name === "乐观"
                    ? "var(--signal-green)"
                    : sc.name === "悲观"
                      ? "var(--signal-red)"
                      : "var(--color-accent)",
              }}
            />
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-4 md:grid-cols-3">
        {scenarios.map((sc) => (
          <article
            key={sc.id}
            className="rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-5"
          >
            <div className="flex items-baseline justify-between">
              <h4 className="font-medium">{sc.name}</h4>
              <span className="font-data text-2xl text-[var(--color-accent)]">
                {sc.probability}%
              </span>
            </div>
            <ul className="mt-3 space-y-1 text-sm text-[var(--color-text-muted)]">
              {sc.drivers.map((d) => (
                <li key={d}>· {d}</li>
              ))}
            </ul>
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[var(--surface-border)] pt-3 text-xs">
              <div>
                <div className="text-[var(--color-text-muted)]">营收</div>
                <div className="font-data">{sc.fpaImpact.revenue}</div>
              </div>
              <div>
                <div className="text-[var(--color-text-muted)]">利润</div>
                <div className="font-data">{sc.fpaImpact.profit}</div>
              </div>
              <div>
                <div className="text-[var(--color-text-muted)]">Runway</div>
                <div
                  className={`font-data ${sc.fpaImpact.runwayMonths < 3 ? "text-[var(--fpa-kpi-negative)]" : ""}`}
                >
                  {sc.fpaImpact.runwayMonths}月
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
