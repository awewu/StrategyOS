"use client";

import { useState, useMemo } from "react";
import { Modal } from "@/components/ui/Modal";
import { useRouter } from "next/navigation";
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer,
} from "recharts";
import {
  DOMAINS, getSignal,
  ALL_MONTHS, HISTORY_END,
  type DomainDef, type MetricDef, type MonthPoint, type MetricSeries,
} from "@/lib/health/ops-metrics";
import { colors } from "@/lib/brand/tokens";
import { Input, Select } from "@/components/ui/primitives";

function signalFromSeries(series: MetricSeries | undefined, metric: MetricDef): "green" | "yellow" | "red" {
  const v = latestActualOf(series);
  return v !== null ? getSignal(v, metric) : "yellow";
}

function latestActualOf(series: MetricSeries | undefined): number | null {
  if (!series) return null;
  const a = series.points.filter((p) => p.actual !== null);
  return a.length ? (a[a.length - 1].actual as number) : null;
}

// ─── Signal colours ──────────────────────────────────────────────────────────
const SIG_COLOR = { green: colors.signalGreen, yellow: colors.signalYellow, red: colors.signalRed } as const;
const SIG_BG    = { green: "bg-[var(--signal-green)]/10 text-[var(--signal-green-text)]", yellow: "bg-[var(--signal-yellow)]/10 text-[var(--signal-yellow-text)]", red: "bg-[var(--signal-red)]/10 text-[var(--signal-red-text)]" } as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(v: number | null, unit: string) {
  if (v === null) return "—";
  if (unit === "万元") return `${(v / 10000).toFixed(1)}k`;
  if (Math.abs(v) >= 1000) return v.toLocaleString("zh-CN", { maximumFractionDigits: 0 });
  return String(v);
}

function deltaPct(current: number | null, prev: number | null): { text: string; up: boolean } | null {
  if (current == null || prev == null || prev === 0) return null;
  const d = ((current - prev) / Math.abs(prev)) * 100;
  return { text: `${d > 0 ? "+" : ""}${d.toFixed(1)}%`, up: d > 0 };
}

// ─── Axis tick formatter ──────────────────────────────────────────────────────
function monthLabel(m: string) {
  const [y, mo] = m.split("-");
  return mo === "01" ? `${y}` : `${mo}月`;
}

// ─── Single metric chart ─────────────────────────────────────────────────────
function MetricChart({ metric, domainColor, series, onEdit }: {
  metric: MetricDef; domainColor: string; series: MetricSeries | undefined; onEdit: (m: MetricDef) => void;
}) {

  const [mode, setMode] = useState<"3y" | "6m" | "all">("3y");

  const data: (MonthPoint & { label: string })[] = useMemo(() => {
    if (!series) return [];
    const points = mode === "6m"
      ? series.points.slice(-42, -30)
      : mode === "3y"
      ? series.points.slice(0, 36)
      : series.points;
    return points.map((p) => ({ ...p, label: monthLabel(p.month) }));
  }, [series, mode]);

  const latestActual = latestActualOf(series);
  const signal = latestActual !== null ? getSignal(latestActual, metric) : "yellow";
  const latestPoint = series?.points.filter((p) => p.actual !== null).at(-1) ?? null;
  const yoyDelta = latestPoint ? deltaPct(latestPoint.actual, latestPoint.yoy) : null;
  const momDelta = latestPoint ? deltaPct(latestPoint.actual, latestPoint.mom) : null;
  const planDelta = latestPoint ? deltaPct(latestPoint.actual, latestPoint.planned) : null;

  const historyEndIdx = ALL_MONTHS.indexOf(HISTORY_END);
  const splitMonth = ALL_MONTHS[historyEndIdx + 1];

  return (
    <div className="rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${SIG_BG[signal]}`}>
              {signal === "green" ? "正常" : signal === "yellow" ? "注意" : "异常"}
            </span>
            <span className="text-sm font-medium">{metric.name}</span>
            <span className="text-caption">{metric.unit}</span>
          </div>
          {latestActual !== null && (
            <div className="mt-1 flex items-baseline gap-3">
              <span className="font-data text-2xl">{fmt(latestActual, metric.unit)}</span>
              {yoyDelta && (
                <span className={`text-xs ${yoyDelta.up === metric.higherIsBetter ? "text-[var(--signal-green-text)]" : "text-[var(--signal-red-text)]"}`}>
                  同比 {yoyDelta.text}
                </span>
              )}
              {momDelta && (
                <span className={`text-xs ${momDelta.up === metric.higherIsBetter ? "text-[var(--signal-green-text)]" : "text-[var(--signal-red-text)]"}`}>
                  环比 {momDelta.text}
                </span>
              )}
              {planDelta && (
                <span className={`text-xs ${Math.abs(Number(planDelta.text)) < 3 ? "text-[var(--color-text-muted)]" : planDelta.up === metric.higherIsBetter ? "text-[var(--signal-green-text)]" : "text-[var(--signal-red-text)]"}`}>
                  vs目标 {planDelta.text}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs">
          {(["3y", "6m", "all"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded px-2 py-0.5 transition-colors ${mode === m ? "bg-black/[0.08] text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"}`}
            >
              {m === "3y" ? "3年历史" : m === "6m" ? "近6月" : "全部"}
            </button>
          ))}
          <button
            onClick={() => onEdit(metric)}
            className="ml-1 rounded px-2 py-0.5 text-[var(--color-accent)] transition-colors hover:bg-black/[0.06]"
            title="录入月度实绩"
          >
            录入
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={160}>
        <ComposedChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid-stroke)" />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--chart-axis-tick)" }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 10, fill: "var(--chart-axis-tick)" }} />
          <Tooltip
            contentStyle={{ background: "var(--chart-tooltip-bg)", border: "1px solid var(--surface-border-strong)", fontSize: 12 }}
            formatter={(v: unknown, name: unknown) => [
              `${fmt(v as number, metric.unit)} ${metric.unit}`,
              String(name) === "actual" ? "实际" : "规划",
            ]}
            labelFormatter={(l) => l}
          />
          {/* plan line */}
          <Line dataKey="planned" stroke={domainColor} strokeWidth={1} strokeDasharray="4 3" dot={false} name="规划" />
          {/* actual bars */}
          <Bar dataKey="actual" fill={SIG_COLOR[signal]} opacity={0.7} radius={[2, 2, 0, 0]} name="实际" maxBarSize={12} />
          {/* history/plan split */}
          {mode !== "6m" && splitMonth && (
            <ReferenceLine x={monthLabel(splitMonth)} stroke="var(--color-text-secondary)" strokeDasharray="2 2" label={{ value: "计划→", position: "insideTopRight", fontSize: 9, fill: "var(--color-text-secondary)" }} />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Domain summary row ───────────────────────────────────────────────────────
function DomainSummaryRow({ domain, onClick, active, seriesMap }: {
  domain: DomainDef; onClick: () => void; active: boolean; seriesMap: Map<string, MetricSeries>;
}) {
  const signals = domain.metrics.map((m) => signalFromSeries(seriesMap.get(m.id), m));
  const worst = signals.includes("red") ? "red" : signals.includes("yellow") ? "yellow" : "green";

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
        active
          ? "border-black/15 bg-black/[0.06]"
          : "border-[var(--surface-border)] bg-[var(--color-bg-surface)] hover:bg-black/[0.04]"
      }`}
    >
      <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: domain.color }} />
      <span className="flex-1 text-sm font-medium">{domain.name}</span>
      <div className="flex gap-1">
        {signals.map((s, i) => (
          <span key={i} className="h-2 w-2 rounded-full" style={{ backgroundColor: SIG_COLOR[s] }} />
        ))}
      </div>
      <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${SIG_BG[worst]}`}>
        {worst === "green" ? "正常" : worst === "yellow" ? "注意" : "异常"}
      </span>
    </button>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────
export function OpsHealthDashboard({ series }: { series: MetricSeries[] }) {
  const router = useRouter();
  const [activeDomain, setActiveDomain] = useState<string>(DOMAINS[0].id);
  const [editMetric, setEditMetric] = useState<MetricDef | null>(null);
  const domain = DOMAINS.find((d) => d.id === activeDomain)!;

  const seriesMap = useMemo(() => new Map(series.map((s) => [s.metricId, s])), [series]);

  const allSignals = DOMAINS.flatMap((d) =>
    d.metrics.map((m) => signalFromSeries(seriesMap.get(m.id), m))
  );
  const redCount    = allSignals.filter((s) => s === "red").length;
  const yellowCount = allSignals.filter((s) => s === "yellow").length;
  const greenCount  = allSignals.filter((s) => s === "green").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">运营健康度全景</h2>
          <p className="text-caption mt-0.5">
            2023–2025 历史 · 2026–2028 规划 · 月度颗粒度 · 同比/环比/目标差
          </p>
        </div>
        <div className="flex gap-3 text-sm">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[var(--signal-green)]" />{greenCount} 正常</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[var(--signal-yellow)]" />{yellowCount} 注意</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[var(--signal-red)]" />{redCount} 异常</span>
        </div>
      </div>

      <div className="grid grid-cols-[220px_1fr] gap-6">
        {/* Left: domain nav */}
        <div className="space-y-2">
          {DOMAINS.map((d) => (
            <DomainSummaryRow
              key={d.id}
              domain={d}
              active={activeDomain === d.id}
              onClick={() => setActiveDomain(d.id)}
              seriesMap={seriesMap}
            />
          ))}
        </div>

        {/* Right: metric charts */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: domain.color }} />
            <span className="font-medium">{domain.name}</span>
            <span className="text-caption">{domain.metrics.length} 项指标</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {domain.metrics.map((m) => (
              <MetricChart key={m.id} metric={m} domainColor={domain.color} series={seriesMap.get(m.id)} onEdit={setEditMetric} />
            ))}
          </div>
        </div>
      </div>

      {editMetric && (
        <OpsMetricInputModal
          metric={editMetric}
          series={seriesMap.get(editMetric.id)}
          onClose={() => setEditMetric(null)}
          onSaved={() => { setEditMetric(null); router.refresh(); }}
        />
      )}
    </div>
  );
}

// ─── Monthly actual input modal ───────────────────────────────────────────────
function OpsMetricInputModal({ metric, series, onClose, onSaved }: {
  metric: MetricDef; series: MetricSeries | undefined; onClose: () => void; onSaved: () => void;
}) {
  const lastActualPoint = series?.points.filter((p) => p.actual !== null).at(-1);
  const defaultMonth = lastActualPoint?.month ?? HISTORY_END;
  const [month, setMonth] = useState(defaultMonth);
  const existing = series?.points.find((p) => p.month === month);
  const [actual, setActual] = useState<string>(existing?.actual != null ? String(existing.actual) : "");
  const [planned, setPlanned] = useState<string>(existing?.planned != null ? String(existing.planned) : "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  function onMonthChange(m: string) {
    setMonth(m);
    const p = series?.points.find((pt) => pt.month === m);
    setActual(p?.actual != null ? String(p.actual) : "");
    setPlanned(p?.planned != null ? String(p.planned) : "");
  }

  async function save() {
    setSaving(true); setErr("");
    try {
      const r = await fetch("/api/health/ops-metric", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metricId: metric.id, month,
          actual: actual.trim() === "" ? null : Number(actual),
          planned: planned.trim() === "" ? null : Number(planned),
        }),
      });
      const d = await r.json();
      if (!r.ok) { setErr(d.error ?? "保存失败"); return; }
      onSaved();
    } catch { setErr("网络错误"); }
    finally { setSaving(false); }
  }

  return (
    <Modal onClose={onClose} size="sm" title={`录入月度实绩 · ${metric.name}`} subtitle={`单位 ${metric.unit} · 留空实际值表示未来规划月`}>
        {err && <p className="mb-3 rounded bg-[var(--signal-red)]/10 px-3 py-2 text-sm text-[var(--signal-red-text)]">{err}</p>}
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--color-text-secondary)]">月份</label>
            <Select fullWidth selectSize="sm" value={month} onChange={(e) => onMonthChange(e.target.value)}>
              {ALL_MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--color-text-secondary)]">实际值</label>
              <Input type="number" step="any" fullWidth inputSize="sm" value={actual} onChange={(e) => setActual(e.target.value)} placeholder="留空=规划月" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--color-text-secondary)]">目标值</label>
              <Input type="number" step="any" fullWidth inputSize="sm" value={planned} onChange={(e) => setPlanned(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md border border-[var(--surface-border)] px-4 py-1.5 text-sm hover:bg-black/[0.04]">取消</button>
          <button onClick={save} disabled={saving} className="rounded-md bg-[var(--color-accent)] px-4 py-1.5 text-sm text-white hover:opacity-90 disabled:opacity-50">
            {saving ? "保存中…" : "保存"}
          </button>
        </div>
    </Modal>
  );
}
