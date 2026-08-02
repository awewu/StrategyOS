"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { Scenario } from "@/lib/types/stratos";
import { Input, Textarea } from "@/components/ui/primitives";
import { weightedRunway } from "@/lib/stratos/spbp-bayes";
import { monteCarloForecast } from "@/lib/stratos/monte-carlo";

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
      setMsg(`贝叶斯更新（posterior ∝ prior × likelihood）· 数据源 ${data.source}`);
    } finally {
      setBusy(false);
    }
  }

  const weightedRev = scenarios.reduce((s, sc) => s + sc.fpaImpact.revenue * (sc.probability / 100), 0);
  const wr = weightedRunway(scenarios);
  const mc = useMemo(
    () => monteCarloForecast(scenarios, { iterations: 4000, seed: 42, runwayThreshold: 3 }),
    [scenarios],
  );
  const breachPct = Math.round(mc.probRunwayBreach * 100);

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
                  sc.name === "乐观" ? "var(--signal-green)" : sc.name === "悲观" ? "var(--signal-red)" : "var(--color-accent)",
              }}
              title={`${sc.name} ${sc.probability}%`}
            />
          ))}
        </div>
      </section>

      <section className="stratos-card stratos-card--padded">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h4 className="text-subsection">蒙特卡洛概率预测</h4>
          <span className="text-caption text-[var(--color-text-muted)]">
            {mc.iterations.toLocaleString()} 次抽样 · 情景混合 + 对数正态噪声 · 种子固定可复现
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <McStat label="营收（万）" p10={mc.revenue.p10} p50={mc.revenue.p50} p90={mc.revenue.p90} />
          <McStat label="利润（万）" p10={mc.profit.p10} p50={mc.profit.p50} p90={mc.profit.p90} />
          <McStat
            label="Runway（月）"
            p10={mc.runway.p10}
            p50={mc.runway.p50}
            p90={mc.runway.p90}
            decimals={1}
          />
        </div>
        <p
          className={`mt-4 rounded-md border px-3 py-2 text-caption ${
            breachPct >= 50
              ? "border-[var(--signal-red)]/40 bg-[var(--signal-red)]/[0.08] text-[var(--signal-red)]"
              : "border-[var(--surface-border)] text-[var(--color-text-muted)]"
          }`}
        >
          P(runway &lt; {mc.runwayThreshold} 月) = <span className="font-data">{breachPct}%</span>
          {breachPct >= 50 ? " · 跨现金安全线概率偏高，建议预案" : " · 现金安全线压力可控"}
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {scenarios.map((sc, i) => (
          <article key={sc.id} className="stratos-card stratos-card--padded">
            {editing ? (
              <div className="space-y-3">
                <Input fullWidth value={sc.name} onChange={(e) => patchScenario(i, { name: e.target.value })} />
                <label className="block">
                  <span className="label-xs">概率 %</span>
                  <Input type="number" fullWidth value={sc.probability} onChange={(e) => patchScenario(i, { probability: +e.target.value })} />
                </label>
                <Textarea fullWidth rows={3} value={sc.drivers.join("\n")} onChange={(e) => patchScenario(i, { drivers: e.target.value.split("\n").filter(Boolean) })} placeholder="驱动因素（每行一条）" />
                <div className="grid grid-cols-3 gap-2">
                  <Input type="number" fullWidth value={sc.fpaImpact.revenue} onChange={(e) => patchScenario(i, { fpaImpact: { ...sc.fpaImpact, revenue: +e.target.value } })} placeholder="营收" />
                  <Input type="number" fullWidth value={sc.fpaImpact.profit} onChange={(e) => patchScenario(i, { fpaImpact: { ...sc.fpaImpact, profit: +e.target.value } })} placeholder="利润" />
                  <Input type="number" step="0.1" fullWidth value={sc.fpaImpact.runwayMonths} onChange={(e) => patchScenario(i, { fpaImpact: { ...sc.fpaImpact, runwayMonths: +e.target.value } })} placeholder="Runway" />
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

function McStat({
  label,
  p10,
  p50,
  p90,
  decimals = 0,
}: {
  label: string;
  p10: number;
  p50: number;
  p90: number;
  decimals?: number;
}) {
  const fmt = (n: number) => n.toFixed(decimals);
  return (
    <div className="rounded-md border border-[var(--surface-border)] p-3">
      <div className="label-xs text-[var(--color-text-muted)]">{label}</div>
      <div className="mt-1 font-data text-[var(--type-kpi)] text-[var(--color-accent)]">{fmt(p50)}</div>
      <div className="mt-1 text-caption text-[var(--color-text-muted)]">
        P10 {fmt(p10)} · P90 {fmt(p90)}
      </div>
    </div>
  );
}
