"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface KpiRow {
  kpiName: string;
  kpiValue: string;
  kpiTarget: string;
  signal: string;
  kpiCode?: string;
  bscDimension?: string;
}

const DIMS = [
  { key: "financial", label: "财务" },
  { key: "customer", label: "客户" },
  { key: "process", label: "流程" },
  { key: "learning", label: "学习" },
] as const;

const inputCls =
  "w-full rounded border border-[var(--surface-border)] bg-transparent px-2 py-1 text-sm";

export function HealthSignalsEditor({
  initialLights,
  initialKpis,
}: {
  initialLights: Record<string, string>;
  initialKpis: KpiRow[];
}) {
  const router = useRouter();
  const [lights, setLights] = useState<Record<string, string>>({
    financial: initialLights.financial ?? "green",
    customer: initialLights.customer ?? "green",
    process: initialLights.process ?? "green",
    learning: initialLights.learning ?? "green",
  });
  const [kpis, setKpis] = useState<KpiRow[]>(initialKpis);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // 从落库信号补全每行的 code/关联维度（initialKpis 来自 healthOverview，缺这两项）。
  useEffect(() => {
    let cancelled = false;
    fetch("/api/health/signals", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.kpis) return;
        const byName = new Map<string, { kpiCode?: string; bscDimension?: string }>(
          data.kpis.map((k: KpiRow) => [k.kpiName, { kpiCode: k.kpiCode ?? "", bscDimension: k.bscDimension ?? "" }]),
        );
        setKpis((prev) =>
          prev.map((row) => {
            const extra = byName.get(row.kpiName);
            return extra ? { ...row, kpiCode: extra.kpiCode, bscDimension: extra.bscDimension } : row;
          }),
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/health/signals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lights, kpis }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "保存失败");
      setMsg("已保存");
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-4">
        {DIMS.map((d) => (
          <label key={d.key} className="flex items-center gap-2 text-sm">
            <span className="w-10 text-[var(--color-text-muted)]">{d.label}</span>
            <select
              className={inputCls}
              value={lights[d.key]}
              onChange={(e) => setLights({ ...lights, [d.key]: e.target.value })}
            >
              <option value="green">绿</option>
              <option value="yellow">黄</option>
              <option value="red">红</option>
            </select>
          </label>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-caption">核心 KPI（名称 / 当前 / 目标 / 信号）{msg ? ` · ${msg}` : ""}</p>
        <div className="flex gap-2">
          <button
            type="button"
            className="stratos-btn stratos-btn--ghost text-xs"
            onClick={() => setKpis([...kpis, { kpiName: "", kpiValue: "", kpiTarget: "", signal: "green" }])}
          >
            + KPI
          </button>
          <button type="button" className="stratos-btn text-xs" disabled={busy} onClick={save}>
            {busy ? "保存中…" : "保存四灯与 KPI"}
          </button>
        </div>
      </div>
      <div className="space-y-2">
        {kpis.map((r, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-[1fr_7rem_7rem_5rem_7rem_6rem_2rem]">
            <input className={inputCls} placeholder="KPI 名称" value={r.kpiName}
              onChange={(e) => setKpis(kpis.map((x, j) => (j === i ? { ...x, kpiName: e.target.value } : x)))} />
            <input className={inputCls} placeholder="当前值" value={r.kpiValue}
              onChange={(e) => setKpis(kpis.map((x, j) => (j === i ? { ...x, kpiValue: e.target.value } : x)))} />
            <input className={inputCls} placeholder="目标值" value={r.kpiTarget}
              onChange={(e) => setKpis(kpis.map((x, j) => (j === i ? { ...x, kpiTarget: e.target.value } : x)))} />
            <select className={inputCls} value={r.signal}
              onChange={(e) => setKpis(kpis.map((x, j) => (j === i ? { ...x, signal: e.target.value } : x)))}>
              <option value="green">绿</option>
              <option value="yellow">黄</option>
              <option value="red">红</option>
            </select>
            <input className={inputCls} placeholder="编码(选填)" value={r.kpiCode ?? ""}
              onChange={(e) => setKpis(kpis.map((x, j) => (j === i ? { ...x, kpiCode: e.target.value } : x)))} />
            <select className={inputCls} value={r.bscDimension ?? ""}
              onChange={(e) => setKpis(kpis.map((x, j) => (j === i ? { ...x, bscDimension: e.target.value } : x)))}>
              <option value="">维度…</option>
              {DIMS.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
            </select>
            <button type="button" className="text-[var(--signal-red)]" aria-label="删除行"
              onClick={() => setKpis(kpis.filter((_, j) => j !== i))}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
}
