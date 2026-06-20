"use client";
import { useMemo, useState } from "react";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Cell,
} from "recharts";
import { TENSION_META, type ExecutionMaturityPoint } from "@/lib/execution/tension-analysis";

const QUADRANT_LABELS = [
  { x: 15, y: 85, label: "快速学习", sub: "高价值区", color: "#22c55e" },
  { x: 65, y: 85, label: "高效执行", sub: "理想区", color: "#3b82f6" },
  { x: 15, y: 15, label: "高风险区", sub: "慢且不学习", color: "#ef4444" },
  { x: 65, y: 15, label: "执行型", sub: "快但不调适", color: "#f59e0b" },
];

function CustomDot(props: {
  cx?: number; cy?: number; payload?: ExecutionMaturityPoint;
  selected: string; onSelect: (code: string) => void;
}) {
  const { cx = 0, cy = 0, payload, selected, onSelect } = props;
  if (!payload) return null;
  const meta = TENSION_META[payload.tensionType];
  const r = Math.max(8, Math.min(20, payload.budgetTotal / 12));
  const isSelected = selected === payload.projectCode;
  return (
    <g onClick={() => onSelect(payload.projectCode)} style={{ cursor: "pointer" }}>
      <circle cx={cx} cy={cy} r={r + (isSelected ? 3 : 0)} fill={meta.color} fillOpacity={isSelected ? 0.9 : 0.55}
        stroke={isSelected ? "white" : meta.color} strokeWidth={isSelected ? 2 : 1} />
      <text x={cx} y={cy - r - 4} textAnchor="middle" fill="white" fontSize={10}>{payload.projectCode}</text>
    </g>
  );
}

function TooltipContent({ active, payload }: { active?: boolean; payload?: Array<{ payload: ExecutionMaturityPoint }> }) {
  if (!active || !payload?.[0]) return null;
  const p = payload[0].payload;
  const meta = TENSION_META[p.tensionType];
  return (
    <div className="rounded-lg border border-black/15 bg-[#1e293b] p-3 text-xs shadow-xl">
      <div className="mb-2 font-medium">{p.projectName} ({p.projectCode})</div>
      <div className="space-y-1 text-[#828c8d]">
        <div>速度（里程碑准时率）<span className="ml-2 text-[var(--color-text-primary)]">{Math.round(p.milestoneOnTimeRate * 100)}%</span></div>
        <div>学习速度（假设命中率）<span className="ml-2 text-[var(--color-text-primary)]">{Math.round(p.assumptionHitRate * 100)}%</span></div>
        <div>响应延迟<span className="ml-2 text-[var(--color-text-primary)]">{p.responseLatencyDays} 天</span></div>
        <div>预算规模<span className="ml-2 text-[var(--color-text-primary)]">{p.budgetTotal} 万</span></div>
        <div>张力类型<span className="ml-2 font-medium" style={{ color: meta.color }}>{meta.label}</span></div>
      </div>
    </div>
  );
}

export function ExecutionMaturity({ points }: { points: ExecutionMaturityPoint[] }) {
  const [selected, setSelected] = useState<string>("");

  const chartData = useMemo(() => points.map((p) => ({
    ...p,
    x: Math.round(p.milestoneOnTimeRate * 100),
    y: Math.round(p.assumptionHitRate * 100),
  })), [points]);

  const selectedPoint = points.find((p) => p.projectCode === selected);
  const meta = selectedPoint ? TENSION_META[selectedPoint.tensionType] : null;

  const avgSpeed = Math.round(points.reduce((s, p) => s + p.milestoneOnTimeRate, 0) / points.length * 100);
  const avgLearn = Math.round(points.reduce((s, p) => s + p.assumptionHitRate, 0) / points.length * 100);
  const highRisk = points.filter((p) => p.milestoneOnTimeRate < 0.5 && p.assumptionHitRate < 0.5);

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="text-base font-semibold">执行成熟度矩阵</h2>
          <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
            X 轴：里程碑准时率（速度）· Y 轴：假设命中率（学习速度）· 气泡大小 = 预算规模
          </p>
        </div>
        <div className="flex gap-4 text-xs text-[var(--color-text-muted)]">
          <span>均速 <span className="text-[var(--color-text-primary)]">{avgSpeed}%</span></span>
          <span>均学 <span className="text-[var(--color-text-primary)]">{avgLearn}%</span></span>
          {highRisk.length > 0 && (
            <span className="text-red-400">{highRisk.map((p) => p.projectCode).join("、")} 高风险</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_260px] gap-4">
        <div className="rounded-lg border border-black/10 bg-[var(--color-bg-surface)] p-4">
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
              <XAxis type="number" dataKey="x" domain={[0, 100]} tickCount={6}
                tick={{ fontSize: 10, fill: "#828c8d" }} label={{ value: "速度（%）", position: "insideBottom", offset: -10, fill: "#828c8d", fontSize: 11 }} />
              <YAxis type="number" dataKey="y" domain={[0, 100]} tickCount={6}
                tick={{ fontSize: 10, fill: "#828c8d" }} label={{ value: "学习速度（%）", angle: -90, position: "insideLeft", fill: "#828c8d", fontSize: 11 }} />
              <ReferenceLine x={50} stroke="#ffffff15" strokeDasharray="4 3" />
              <ReferenceLine y={50} stroke="#ffffff15" strokeDasharray="4 3" />
              <Tooltip content={<TooltipContent />} />
              <Scatter data={chartData} shape={(props: unknown) => (
                <CustomDot {...(props as Parameters<typeof CustomDot>[0])} selected={selected} onSelect={setSelected} />
              )}>
                {chartData.map((entry) => <Cell key={entry.projectCode} fill={TENSION_META[entry.tensionType].color} />)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          <div className="mt-1 grid grid-cols-2 gap-x-8 gap-y-1">
            {QUADRANT_LABELS.map((q) => (
              <div key={q.label} className="flex items-center gap-1.5 text-xs">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: q.color }} />
                <span className="text-[var(--color-text-muted)]">{q.label}</span>
                <span className="text-[#4e5758]">— {q.sub}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {selectedPoint && meta ? (
            <div className={`rounded-lg border p-4 ${meta.bgColor} border-opacity-40`} style={{ borderColor: meta.color + "66" }}>
              <div className="mb-3 text-sm font-medium">{selectedPoint.projectName}</div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-[var(--color-text-muted)]">负责人</span><span>{selectedPoint.owner}</span></div>
                <div className="flex justify-between"><span className="text-[var(--color-text-muted)]">层面</span><span>{selectedPoint.horizon}</span></div>
                <div className="flex justify-between"><span className="text-[var(--color-text-muted)]">响应延迟</span>
                  <span className={selectedPoint.responseLatencyDays > 14 ? "text-red-400" : "text-green-400"}>{selectedPoint.responseLatencyDays} 天</span>
                </div>
                <div className="flex justify-between"><span className="text-[var(--color-text-muted)]">主要张力</span>
                  <span style={{ color: meta.color }}>{meta.label}</span>
                </div>
                <div className="mt-3 border-t border-black/10 pt-3">
                  <div className="mb-1 text-[var(--color-text-muted)]">建议对策</div>
                  <p>{meta.rightResponse}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center rounded-lg border border-black/10 text-xs text-[var(--color-text-muted)]">
              点击矩阵中的项目查看详情
            </div>
          )}

          <div className="rounded-lg border border-black/10 bg-[var(--color-bg-surface)] p-3">
            <div className="mb-2 text-xs font-medium text-[var(--color-text-muted)]">图例</div>
            <div className="space-y-1.5">
              {points.map((p) => (
                <div key={p.projectCode} className="flex items-center gap-2 text-xs">
                  <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: TENSION_META[p.tensionType].color }} />
                  <span className="font-medium">{p.projectCode}</span>
                  <span className="text-[var(--color-text-muted)]">{p.projectName}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
