"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Scenario } from "@/lib/types/stratos";
import { weightedRunway } from "@/lib/stratos/spbp-bayes";

export function SpbpScenarioEditor({
  initialScenarios,
  source,
}: {
  initialScenarios: Scenario[];
  source: "database" | "demo";
}) {
  const router = useRouter();
  const [scenarios, setScenarios] = useState(initialScenarios);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function patchScenario(index: number, patch: Partial<Scenario>) {
    setScenarios((prev) =>
      prev.map((sc, i) =>
        i === index
          ? {
              ...sc,
              ...patch,
              fpaImpact: patch.fpaImpact ? { ...sc.fpaImpact, ...patch.fpaImpact } : sc.fpaImpact,
            }
          : sc,
      ),
    );
  }

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/spbp/scenarios", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarios }),
      });
      const j = (await res.json()) as { scenarios?: Scenario[]; error?: string };
      if (!res.ok) throw new Error(j.error ?? "保存失败");
      if (j.scenarios) setScenarios(j.scenarios);
      setEditing(false);
      setMsg("SPBP 情景已保存");
      router.refresh();
      window.setTimeout(() => setMsg(null), 3500);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }

  async function applyEvidence(type: "optimistic" | "pessimistic" | "reset") {
    setBusy(true);
    setMsg(null);
    try {
      if (type === "reset") {
        setScenarios(initialScenarios);
        setMsg("已重置为页面加载时概率");
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
      setMsg(`贝叶斯式更新 · 数据源 ${data.source}`);
    } finally {
      setBusy(false);
    }
  }

  const weightedRev = scenarios.reduce((s, sc) => s + sc.fpaImpact.revenue * (sc.probability / 100), 0);
  const wr = weightedRunway(scenarios);

  return (
    <div className="stratos-page">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-caption">数据源 {source === "database" ? "DB" : "Demo"}</p>
        <div className="flex flex-wrap items-center gap-2">
          {msg ? <span className="text-caption text-[var(--color-accent)]">{msg}</span> : null}
          {editing ? (
            <>
              <button type="button" className="stratos-btn stratos-btn--ghost" onClick={() => setEditing(false)} disabled={busy}>
                取消
              </button>
              <button type="button" className="stratos-btn stratos-btn--primary" onClick={() => void save()} disabled={busy}>
                {busy ? "保存中…" : "保存情景"}
              </button>
            </>
          ) : (
            <button type="button" className="stratos-btn stratos-btn--primary" onClick={() => setEditing(true)}>
              编辑情景
            </button>
          )}
        </div>
      </div>

      {!editing ? (
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={() => void applyEvidence("pessimistic")} className="stratos-btn stratos-btn--ghost">
            Q2 证据偏悲观
          </button>
          <button type="button" disabled={busy} onClick={() => void applyEvidence("optimistic")} className="stratos-btn stratos-btn--ghost">
            Q2 证据偏乐观
          </button>
          <button type="button" disabled={busy} onClick={() => void applyEvidence("reset")} className="stratos-btn stratos-btn--ghost">
            重置概率
          </button>
        </div>
      ) : null}

      <section className="stratos-card stratos-card--padded">
        <p className="stratos-section-desc mb-4">
          加权期望 · 营收 {Math.round(weightedRev)} 万 · runway {wr.toFixed(1)} 月
        </p>
        <div className="flex h-3 overflow-hidden rounded-full">
          {scenarios.map((sc) => (
            <div
              key={sc.id}
              className="h-full"
              style={{
                width: `${sc.probability}%`,
                backgroundColor:
                  sc.name === "乐观" ? "#22c55e" : sc.name === "悲观" ? "#8b0e04" : "var(--color-accent)",
              }}
              title={`${sc.name} ${sc.probability}%`}
            />
          ))}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {scenarios.map((sc, i) => (
          <article key={sc.id} className="stratos-card stratos-card--padded">
            {editing ? (
              <div className="space-y-3">
                <input className="stratos-input" value={sc.name} onChange={(e) => patchScenario(i, { name: e.target.value })} />
                <label className="block">
                  <span className="label-xs">概率 %</span>
                  <input type="number" className="stratos-input" value={sc.probability} onChange={(e) => patchScenario(i, { probability: +e.target.value })} />
                </label>
                <textarea className="stratos-input" rows={3} value={sc.drivers.join("\n")} onChange={(e) => patchScenario(i, { drivers: e.target.value.split("\n").filter(Boolean) })} placeholder="驱动因素（每行一条）" />
                <div className="grid grid-cols-3 gap-2">
                  <input type="number" className="stratos-input" value={sc.fpaImpact.revenue} onChange={(e) => patchScenario(i, { fpaImpact: { revenue: +e.target.value } })} placeholder="营收" />
                  <input type="number" className="stratos-input" value={sc.fpaImpact.profit} onChange={(e) => patchScenario(i, { fpaImpact: { profit: +e.target.value } })} placeholder="利润" />
                  <input type="number" step="0.1" className="stratos-input" value={sc.fpaImpact.runwayMonths} onChange={(e) => patchScenario(i, { fpaImpact: { runwayMonths: +e.target.value } })} placeholder="Runway" />
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-baseline justify-between">
                  <h4 className="text-subsection">{sc.name}</h4>
                  <span className="font-data text-[var(--type-kpi)] text-[var(--color-accent)]">{sc.probability}%</span>
                </div>
                <ul className="mt-3 space-y-1 stratos-prose">
                  {sc.drivers.map((d) => (
                    <li key={d}>· {d}</li>
                  ))}
                </ul>
                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[var(--surface-border)] pt-3 text-caption">
                  <div>
                    <div>营收</div>
                    <div className="font-data">{sc.fpaImpact.revenue}</div>
                  </div>
                  <div>
                    <div>利润</div>
                    <div className="font-data">{sc.fpaImpact.profit}</div>
                  </div>
                  <div>
                    <div>Runway</div>
                    <div className={`font-data ${sc.fpaImpact.runwayMonths < 3 ? "text-[var(--signal-red)]" : ""}`}>
                      {sc.fpaImpact.runwayMonths}月
                    </div>
                  </div>
                </div>
              </>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
