"use client";
import { useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useRouter } from "next/navigation";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Cell,
} from "recharts";
import { TENSION_META, type ExecutionMaturityPoint, type TensionType } from "@/lib/execution/tension-analysis";
import { Input, Select } from "@/components/ui/primitives";

function MaturityModal({ item, onClose, onSaved }: {
  item: Partial<ExecutionMaturityPoint>; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState<Partial<ExecutionMaturityPoint>>({ tensionType: "capability", horizon: "H1", ...item });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    setSaving(true); setErr("");
    try {
      const r = await fetch("/api/execution/maturity", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok) { setErr(d.error ?? "保存失败"); return; }
      onSaved();
    } catch { setErr("网络错误"); }
    finally { setSaving(false); }
  }

  const pctField = (label: string, key: "milestoneOnTimeRate" | "assumptionHitRate") => (
    <div className="space-y-1">
      <label className="text-xs font-medium text-[var(--color-text-secondary)]">{label}（0–100）</label>
      <Input type="number" fullWidth inputSize="sm" min={0} max={100}
        value={form[key] != null ? Math.round((form[key] as number) * 100) : ""}
        onChange={(e) => setForm({ ...form, [key]: e.target.value === "" ? undefined : Number(e.target.value) / 100 })} />
    </div>
  );

  return (
    <Modal onClose={onClose} size="lg" title={item.projectCode ? "编辑成熟度" : "新增项目成熟度"}>
        {err && <p className="mb-3 rounded bg-[var(--signal-red)]/10 px-3 py-2 text-sm text-[var(--signal-red)]">{err}</p>}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--color-text-secondary)]">项目代号 *</label>
              <Input fullWidth inputSize="sm" value={form.projectCode ?? ""} onChange={(e) => setForm({ ...form, projectCode: e.target.value })} placeholder="V4" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--color-text-secondary)]">项目名称 *</label>
              <Input fullWidth inputSize="sm" value={form.projectName ?? ""} onChange={(e) => setForm({ ...form, projectName: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--color-text-secondary)]">负责人</label>
              <Input fullWidth inputSize="sm" value={form.owner ?? ""} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--color-text-secondary)]">层面</label>
              <Select fullWidth selectSize="sm" value={form.horizon} onChange={(e) => setForm({ ...form, horizon: e.target.value })}>
                <option value="H1">H1</option><option value="H2">H2</option><option value="H3">H3</option>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {pctField("里程碑准时率", "milestoneOnTimeRate")}
            {pctField("假设命中率", "assumptionHitRate")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--color-text-secondary)]">响应延迟（天）</label>
              <Input type="number" fullWidth inputSize="sm" value={form.responseLatencyDays ?? ""} onChange={(e) => setForm({ ...form, responseLatencyDays: e.target.value === "" ? undefined : Number(e.target.value) })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--color-text-secondary)]">预算规模（万）</label>
              <Input type="number" fullWidth inputSize="sm" value={form.budgetTotal ?? ""} onChange={(e) => setForm({ ...form, budgetTotal: e.target.value === "" ? undefined : Number(e.target.value) })} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--color-text-secondary)]">主要张力</label>
            <Select fullWidth selectSize="sm" value={form.tensionType} onChange={(e) => setForm({ ...form, tensionType: e.target.value as TensionType })}>
              <option value="capability">能力张力</option>
              <option value="direction">方向张力</option>
              <option value="adaptation">适应张力</option>
              <option value="resource">资源张力</option>
            </Select>
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

const QUADRANT_LABELS = [
  { x: 15, y: 85, label: "快速学习", sub: "高价值区", color: "var(--signal-green)" },
  { x: 65, y: 85, label: "高效执行", sub: "理想区", color: "var(--color-accent)" },
  { x: 15, y: 15, label: "高风险区", sub: "慢且不学习", color: "var(--signal-red)" },
  { x: 65, y: 15, label: "执行型", sub: "快但不调适", color: "var(--signal-yellow)" },
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
    <div className="rounded-lg border border-[var(--surface-border)] bg-[var(--chart-tooltip-bg)] p-3 text-xs shadow-xl">
      <div className="mb-2 font-medium">{p.projectName} ({p.projectCode})</div>
      <div className="space-y-1 text-[var(--color-text-muted)]">
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
  const router = useRouter();
  const [selected, setSelected] = useState<string>("");
  const [editItem, setEditItem] = useState<Partial<ExecutionMaturityPoint> | null>(null);

  const chartData = useMemo(() => points.map((p) => ({
    ...p,
    x: Math.round(p.milestoneOnTimeRate * 100),
    y: Math.round(p.assumptionHitRate * 100),
  })), [points]);

  const selectedPoint = points.find((p) => p.projectCode === selected);
  const meta = selectedPoint ? TENSION_META[selectedPoint.tensionType] : null;

  const avgSpeed = points.length ? Math.round(points.reduce((s, p) => s + p.milestoneOnTimeRate, 0) / points.length * 100) : 0;
  const avgLearn = points.length ? Math.round(points.reduce((s, p) => s + p.assumptionHitRate, 0) / points.length * 100) : 0;
  const highRisk = points.filter((p) => p.milestoneOnTimeRate < 0.5 && p.assumptionHitRate < 0.5);

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="text-base font-semibold">执行成熟度矩阵</h2>
          <p className="mt-0.5 text-caption">
            X 轴：里程碑准时率（速度）· Y 轴：假设命中率（学习速度）· 气泡大小 = 预算规模
          </p>
        </div>
        <div className="flex items-center gap-4 text-caption">
          <span>均速 <span className="text-[var(--color-text-primary)]">{avgSpeed}%</span></span>
          <span>均学 <span className="text-[var(--color-text-primary)]">{avgLearn}%</span></span>
          {highRisk.length > 0 && (
            <span className="text-[var(--signal-red)]">{highRisk.map((p) => p.projectCode).join("、")} 高风险</span>
          )}
          <button onClick={() => setEditItem({})} className="rounded-md bg-[var(--color-accent)] px-2.5 py-1 text-white hover:opacity-90">+ 录入项目</button>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_260px] gap-4">
        <div className="rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-4">
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid-stroke)" />
              <XAxis type="number" dataKey="x" domain={[0, 100]} tickCount={6}
                tick={{ fontSize: 10, fill: "var(--chart-axis-tick)" }} label={{ value: "速度（%）", position: "insideBottom", offset: -10, fill: "var(--chart-axis-tick)", fontSize: 11 }} />
              <YAxis type="number" dataKey="y" domain={[0, 100]} tickCount={6}
                tick={{ fontSize: 10, fill: "var(--chart-axis-tick)" }} label={{ value: "学习速度（%）", angle: -90, position: "insideLeft", fill: "var(--chart-axis-tick)", fontSize: 11 }} />
              <ReferenceLine x={50} stroke="var(--chart-ref-line)" strokeDasharray="4 3" />
              <ReferenceLine y={50} stroke="var(--chart-ref-line)" strokeDasharray="4 3" />
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
                <span className="text-[var(--color-text-secondary)]">— {q.sub}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {selectedPoint && meta ? (
            <div className={`rounded-lg border p-4 ${meta.bgColor} border-opacity-40`} style={{ borderColor: meta.color + "66" }}>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium">{selectedPoint.projectName}</span>
                <button onClick={() => setEditItem(selectedPoint)} className="text-xs text-[var(--color-accent)] hover:underline">编辑</button>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-[var(--color-text-muted)]">负责人</span><span>{selectedPoint.owner}</span></div>
                <div className="flex justify-between"><span className="text-[var(--color-text-muted)]">层面</span><span>{selectedPoint.horizon}</span></div>
                <div className="flex justify-between"><span className="text-[var(--color-text-muted)]">响应延迟</span>
                  <span className={selectedPoint.responseLatencyDays > 14 ? "text-[var(--signal-red)]" : "text-[var(--signal-green)]"}>{selectedPoint.responseLatencyDays} 天</span>
                </div>
                <div className="flex justify-between"><span className="text-[var(--color-text-muted)]">主要张力</span>
                  <span style={{ color: meta.color }}>{meta.label}</span>
                </div>
                <div className="mt-3 border-t border-[var(--surface-border)] pt-3">
                  <div className="mb-1 text-[var(--color-text-muted)]">建议对策</div>
                  <p>{meta.rightResponse}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center rounded-lg border border-[var(--surface-border)] text-caption">
              点击矩阵中的项目查看详情
            </div>
          )}

          <div className="rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-3">
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

      {editItem && (
        <MaturityModal item={editItem} onClose={() => setEditItem(null)} onSaved={() => { setEditItem(null); router.refresh(); }} />
      )}
    </section>
  );
}
