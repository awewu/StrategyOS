"use client";

import { useMemo, useState } from "react";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceArea, ReferenceLine, ResponsiveContainer,
} from "recharts";
import {
  buildPositioning,
  SWOT_CATEGORY_LABEL,
  TOWS_LABEL,
  type PositioningMap,
  type SwotBoard,
  type SwotCategory,
  type SwotItem,
  type TowsSet,
  type TowsType,
} from "@/lib/market-intel/swot";
import { DIMENSION_LABEL } from "@/lib/market-intel/types";
import type { IntelDimension, IntelSignal } from "@/lib/market-intel/types";

const CAT_COLOR: Record<SwotCategory, string> = {
  strength: "var(--signal-green)",
  weakness: "var(--signal-red)",
  opportunity: "var(--color-accent)",
  threat: "var(--signal-yellow)",
};

const POSITIONING_DOMAIN = [0, 100] as const;
const CENTERED_TICKS = [0, 25, 50, 75, 100];

function centeredTick(value: number | string, center: number) {
  const offset = Number(value) - center;
  if (offset > 0) return `+${offset}`;
  return `${offset}`;
}

export function SelfScoreEditor({
  scores,
  onChange,
  onSave,
  saving,
  saveNote,
  source,
}: {
  scores: Partial<Record<IntelDimension, number>>;
  onChange: (scores: Partial<Record<IntelDimension, number>>) => void;
  onSave: () => void;
  saving: boolean;
  saveNote: string;
  source?: "database" | "demo";
}) {
  const dims: IntelDimension[] = ["product", "gtm", "brand", "strategy"];
  return (
    <div className="rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">我方自评分</h3>
          <p className="text-caption">
            0–100，用于十字轴定位。X = 产品+战略，Y = GTM+品牌。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded bg-black/[0.05] px-1.5 py-0.5 text-caption">
            {source === "database" ? "已持久化" : "Demo"}
          </span>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-sm text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "保存中…" : "保存"}
          </button>
        </div>
      </div>
      {saveNote && <p className="mb-2 text-caption">{saveNote}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        {dims.map((dim) => {
          const value = scores[dim] ?? 50;
          return (
            <div key={dim} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--color-text-secondary)]">{DIMENSION_LABEL[dim]}</span>
                <span className="font-medium text-[var(--color-text-primary)]">{value}</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={value}
                onChange={(e) => onChange({ ...scores, [dim]: Number(e.target.value) })}
                className="w-full accent-[var(--color-accent)]"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PositioningChart({ map }: { map: PositioningMap }) {
  const data = useMemo(
    () => map.entities.map((e) => ({ ...e })),
    [map],
  );
  const midX = map.midpoint.x;
  const midY = map.midpoint.y;

  return (
    <div className="rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-4">
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">竞争定位十字轴</h3>
        <p className="mt-0.5 text-caption">
          X：{map.xAxis.label} · Y：{map.yAxis.label} · 原点在中心 · 我方高亮
        </p>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <ScatterChart margin={{ top: 24, right: 28, bottom: 28, left: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid-stroke)" />
          <ReferenceArea x1={midX} x2={100} y1={midY} y2={100} fill="var(--color-accent)" fillOpacity={0.04} />
          <ReferenceArea x1={0} x2={midX} y1={midY} y2={100} fill="var(--signal-yellow)" fillOpacity={0.04} />
          <ReferenceArea x1={midX} x2={100} y1={0} y2={midY} fill="var(--signal-green)" fillOpacity={0.035} />
          <ReferenceArea x1={0} x2={midX} y1={0} y2={midY} fill="var(--signal-red)" fillOpacity={0.035} />
          <XAxis
            type="number" dataKey="x" domain={POSITIONING_DOMAIN} ticks={CENTERED_TICKS}
            tick={{ fontSize: 10, fill: "var(--chart-axis-tick)" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => centeredTick(value, midX)}
            label={{ value: map.xAxis.label, position: "insideBottom", offset: -12, fill: "var(--chart-axis-tick)", fontSize: 11 }}
          />
          <YAxis
            type="number" dataKey="y" domain={POSITIONING_DOMAIN} ticks={CENTERED_TICKS}
            tick={{ fontSize: 10, fill: "var(--chart-axis-tick)" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => centeredTick(value, midY)}
            label={{ value: map.yAxis.label, angle: -90, position: "insideLeft", fill: "var(--chart-axis-tick)", fontSize: 11 }}
          />
          <ReferenceLine x={midX} stroke="var(--chart-ref-line)" strokeWidth={1.5} />
          <ReferenceLine y={midY} stroke="var(--chart-ref-line)" strokeWidth={1.5} />
          <Tooltip content={<PositioningTooltip />} />
          <Scatter data={data} shape={(props: unknown) => <EntityDot {...(props as EntityDotProps)} />} />
        </ScatterChart>
      </ResponsiveContainer>
      <div className="mt-1 grid grid-cols-2 gap-x-8 gap-y-1 text-caption">
        <span>右上 · 领先者（双强）</span>
        <span>左上 · 渠道驱动</span>
        <span>右下 · 产品驱动</span>
        <span>左下 · 跟随者</span>
      </div>
    </div>
  );
}

interface EntityDotProps {
  cx?: number;
  cy?: number;
  payload?: PositioningMap["entities"][number];
}

function EntityDot({ cx = 0, cy = 0, payload }: EntityDotProps) {
  if (!payload) return null;
  const isUs = payload.isUs;
  const lowConf = payload.confidence < 0.5;
  const color = isUs ? "var(--color-accent)" : "var(--color-text-secondary)";
  const r = isUs ? 9 : 7;
  return (
    <g>
      <circle
        cx={cx} cy={cy} r={r}
        fill={color}
        fillOpacity={isUs ? 0.95 : lowConf ? 0.3 : 0.6}
        stroke={isUs ? "white" : color}
        strokeWidth={isUs ? 2 : 1}
        strokeDasharray={lowConf ? "3 2" : undefined}
      />
      <text x={cx} y={cy - r - 4} textAnchor="middle" fontSize={10}
        fill={isUs ? "var(--color-accent)" : "var(--color-text-secondary)"}
        fontWeight={isUs ? 600 : 400}>
        {payload.entity}{lowConf ? " ?" : ""}
      </text>
    </g>
  );
}

function PositioningTooltip({ active, payload }: {
  active?: boolean;
  payload?: Array<{ payload: PositioningMap["entities"][number] }>;
}) {
  if (!active || !payload?.[0]) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border border-[var(--surface-border)] bg-[var(--chart-tooltip-bg)] p-3 text-xs shadow-xl">
      <div className="mb-1 font-medium">{p.entity}{p.isUs ? "（我方）" : ""}</div>
      <div className="space-y-0.5 text-[var(--color-text-muted)]">
        <div>X 产品·创新力 <span className="ml-2 text-[var(--color-text-primary)]">{Math.round(p.x)}</span></div>
        <div>Y 渠道·品牌力 <span className="ml-2 text-[var(--color-text-primary)]">{Math.round(p.y)}</span></div>
        <div>数据完备度 <span className="ml-2 text-[var(--color-text-primary)]">{Math.round(p.confidence * 100)}%</span></div>
        {!p.isUs && <div>情报条数 <span className="ml-2 text-[var(--color-text-primary)]">{p.signalCount}</span></div>}
      </div>
    </div>
  );
}

function SwotQuadrant({ cat, items }: { cat: SwotCategory; items: SwotItem[] }) {
  return (
    <div className="rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-4"
      style={{ borderLeft: `3px solid ${CAT_COLOR[cat]}` }}>
      <h4 className="mb-2 text-sm font-semibold" style={{ color: CAT_COLOR[cat] }}>
        {SWOT_CATEGORY_LABEL[cat]} <span className="text-[var(--color-text-muted)]">· {items.length}</span>
      </h4>
      {items.length === 0 ? (
        <p className="text-caption">暂无</p>
      ) : (
        <ul className="space-y-1.5">
          {items.slice(0, 6).map((i) => (
            <li key={i.id} className="text-xs text-[var(--color-text-secondary)]">
              <span className="mr-1.5 inline-block rounded bg-black/[0.05] px-1 text-caption">
                {i.weight}×{i.intensity}
              </span>
              {i.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const TOWS_ORDER: TowsType[] = ["SO", "WO", "ST", "WT"];

export function SwotPanel({
  board,
  initialTows,
  initialEngine,
  signals,
  internal,
  swotSource,
  initialSelfScores,
  momentumByEntity,
  selfScoresSource,
}: {
  board: SwotBoard;
  initialTows: TowsSet;
  initialEngine: "llm" | "rule";
  signals: IntelSignal[];
  internal: SwotItem[];
  swotSource?: string;
  initialSelfScores: Partial<Record<IntelDimension, number>>;
  momentumByEntity: Record<string, "up" | "down" | "flat">;
  selfScoresSource?: "database" | "demo";
}) {
  const [selfScores, setSelfScores] = useState<Partial<Record<IntelDimension, number>>>(initialSelfScores);
  const [saving, setSaving] = useState(false);
  const [saveNote, setSaveNote] = useState("");
  const positioning = useMemo(
    () => buildPositioning(signals, momentumByEntity, { selfScores, selfLabel: "我方" }),
    [signals, momentumByEntity, selfScores],
  );

  async function saveScores() {
    setSaving(true);
    setSaveNote("");
    try {
      const r = await fetch("/api/market/self-scores", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scores: selfScores }),
      });
      const d = await r.json();
      if (d.ok) {
        setSaveNote("已保存");
      } else {
        setSaveNote(d.error ?? "保存失败");
      }
    } catch {
      setSaveNote("网络错误");
    } finally {
      setSaving(false);
    }
  }

  const [tows, setTows] = useState<TowsSet>(initialTows);
  const [engine, setEngine] = useState<"llm" | "rule">(initialEngine);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState<string>("");

  async function runAi() {
    setLoading(true);
    setNote("");
    try {
      const r = await fetch("/api/market/swot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signals, internal }),
      });
      const d = await r.json();
      if (d.tows) {
        setTows(d.tows as TowsSet);
        setEngine(d.engine as "llm" | "rule");
        setNote(d.note ?? "");
      } else {
        setNote("推演返回为空");
      }
    } catch {
      setNote("网络错误");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <PositioningChart map={positioning} />
      <SelfScoreEditor
        scores={selfScores}
        onChange={setSelfScores}
        onSave={saveScores}
        saving={saving}
        saveNote={saveNote}
        source={selfScoresSource}
      />

      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
          SWOT 盘面
          <span className="rounded bg-black/[0.05] px-1.5 py-0.5 text-[11px] font-normal text-[var(--color-text-muted)]">
            S/W 源：{swotSource ?? "Demo 基线"} · O/T 源：Hermes
          </span>
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <SwotQuadrant cat="strength" items={board.strength} />
          <SwotQuadrant cat="weakness" items={board.weakness} />
          <SwotQuadrant cat="opportunity" items={board.opportunity} />
          <SwotQuadrant cat="threat" items={board.threat} />
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
            TOWS 战略建议
            <span className="ml-2 rounded px-1.5 py-0.5 text-[11px]"
              style={{
                background: engine === "llm" ? "var(--color-accent)" : "var(--surface-border)",
                color: engine === "llm" ? "white" : "var(--color-text-muted)",
              }}>
              {engine === "llm" ? "AI 推演" : "规则引擎"}
            </span>
          </h3>
          <button
            type="button" onClick={runAi} disabled={loading}
            className="rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-sm text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "推演中…" : "AI 推演"}
          </button>
        </div>
        {note && <p className="mb-2 text-caption">{note}</p>}
        <div className="grid gap-4 md:grid-cols-2">
          {TOWS_ORDER.map((t) => (
            <div key={t} className="rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-4">
              <h4 className="mb-2 text-sm font-semibold text-[var(--color-text-primary)]">{TOWS_LABEL[t]}</h4>
              {tows[t].length === 0 ? (
                <p className="text-caption">暂无</p>
              ) : (
                <ul className="space-y-2">
                  {tows[t].map((r, idx) => (
                    <li key={idx} className="text-xs">
                      <div className="font-medium text-[var(--color-text-secondary)]">{r.title}</div>
                      {r.rationale && <div className="mt-0.5 text-[var(--color-text-muted)]">{r.rationale}</div>}
                      {r.links.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {r.links.map((l) => (
                            <a key={l} href={l} className="rounded bg-black/[0.05] px-1.5 py-0.5 text-[11px] text-[var(--color-accent)] hover:underline">
                              {l}
                            </a>
                          ))}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
