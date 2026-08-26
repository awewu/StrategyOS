"use client";

import { useState } from "react";
import { STRAT_AGENTS, type AgentStepResult } from "@/lib/stratos/agents";

export function AgentOrchestrationPanel() {
  const [steps, setSteps] = useState<AgentStepResult[] | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  async function runAll() {
    setLoading(true);
    try {
      const res = await fetch("/api/agents/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: "rpt-sheet1-may" }),
      });
      const data = (await res.json()) as {
        steps: AgentStepResult[];
        recommendations: string[];
      };
      setSteps(data.steps);
      setRecommendations(data.recommendations);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-lg border border-[color-mix(in_srgb,var(--accent-sim)_30%,transparent)] bg-[var(--color-bg-surface)] p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-[var(--accent-sim)]">11-Agent 编排</h2>
          <p className="text-caption">
            {STRAT_AGENTS.length} agents · LLM 优先 · 无 key 时规则兜底
          </p>
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={runAll}
          className="rounded bg-[var(--accent-sim-dim)] px-4 py-2 text-sm text-[var(--accent-sim)] hover:bg-[color-mix(in_srgb,var(--accent-sim)_20%,white)] disabled:opacity-50"
        >
          {loading ? "编排中…" : "运行全链路"}
        </button>
      </div>

      <div className="mb-4 grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
        {STRAT_AGENTS.map((a) => (
          <div key={a.id} className="rounded border border-[var(--surface-border)] px-2 py-1.5 text-[var(--type-label)]">
            <span className="text-[var(--accent-sim)]">{a.name}</span>
            <span className="ml-2 text-[var(--color-text-muted)]">{a.role}</span>
          </div>
        ))}
      </div>

      {steps && (
        <ol className="space-y-2 border-t border-[var(--surface-border)] pt-4">
          {steps.map((s) => (
            <li key={s.agentId} className="flex gap-3 text-xs">
              <span
                className={`shrink-0 font-data ${
                  s.status === "skipped" ? "text-[var(--color-text-muted)]" : "text-[var(--signal-green-text)]"
                }`}
              >
                {s.status}
              </span>
              <div className="flex-1">
                <span className="font-medium">{s.name}</span>
                <span className="ml-2 text-[var(--color-text-muted)]">{s.durationMs}ms</span>
                {s.output.length > 0 && (
                  <ul className="mt-0.5 text-[var(--color-text-muted)]">
                    {s.output.map((o) => (
                      <li key={o}>→ {o}</li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}

      {recommendations.length > 0 && (
        <div className="mt-4 border-t border-[var(--surface-border)] pt-3">
          <div className="text-caption">Recommendations</div>
          <ul className="mt-1 text-sm">
            {recommendations.map((r) => (
              <li key={r}>· {r}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
