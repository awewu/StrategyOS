"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { TENSION_META, type TensionItem, type TensionType } from "@/lib/execution/tension-analysis";

const SEV_COLOR = { high: "bg-red-500", medium: "bg-yellow-500", low: "bg-green-500" } as const;
const SEV_LABEL = { high: "高", medium: "中", low: "低" } as const;
const tInputCls = "w-full rounded-md border border-[var(--surface-border)] bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]";

function TensionCard({ item, active, onClick }: { item: TensionItem; active: boolean; onClick: () => void }) {
  const meta = TENSION_META[item.tensionType];
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-lg border p-4 text-left transition-all ${active ? meta.bgColor + " " + meta.borderColor : "border-black/10 bg-[var(--color-bg-surface)] hover:border-black/15"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full flex-shrink-0 mt-1" style={{ backgroundColor: meta.color }} />
          <span className="text-xs font-medium" style={{ color: meta.color }}>{meta.label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${SEV_COLOR[item.severity]}`} />
          <span className="text-xs text-[var(--color-text-muted)]">严重度 {SEV_LABEL[item.severity]}</span>
        </div>
      </div>
      <p className="mt-2 text-sm font-medium">{item.projectName}</p>
      <p className="mt-1 text-xs text-[var(--color-text-muted)] line-clamp-2">{item.signal}</p>
    </button>
  );
}

function TensionModal({ item, onClose, onSaved }: {
  item: Partial<TensionItem>; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState<Partial<TensionItem>>({ tensionType: "capability", severity: "medium", ...item });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    setSaving(true); setErr("");
    try {
      const r = await fetch("/api/execution/tension", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok) { setErr(d.error ?? "保存失败"); return; }
      onSaved();
    } catch { setErr("网络错误"); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-lg rounded-xl border border-[var(--surface-border)] bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-base font-semibold text-[var(--color-text-primary)]">{item.id ? "编辑张力" : "新增张力"}</h3>
        {err && <p className="mb-3 rounded bg-[var(--signal-red)]/10 px-3 py-2 text-sm text-[var(--signal-red)]">{err}</p>}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--color-text-secondary)]">项目代号 *</label>
              <input value={form.projectCode ?? ""} onChange={(e) => setForm({ ...form, projectCode: e.target.value })} className={tInputCls} placeholder="V4" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--color-text-secondary)]">项目名称 *</label>
              <input value={form.projectName ?? ""} onChange={(e) => setForm({ ...form, projectName: e.target.value })} className={tInputCls} placeholder="热泵新品上市" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--color-text-secondary)]">张力类型</label>
              <select value={form.tensionType} onChange={(e) => setForm({ ...form, tensionType: e.target.value as TensionType })} className={tInputCls}>
                <option value="capability">能力张力</option>
                <option value="direction">方向张力</option>
                <option value="adaptation">适应张力</option>
                <option value="resource">资源张力</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--color-text-secondary)]">严重度</label>
              <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value as TensionItem["severity"] })} className={tInputCls}>
                <option value="high">高</option>
                <option value="medium">中</option>
                <option value="low">低</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--color-text-secondary)]">信号 *</label>
            <textarea value={form.signal ?? ""} onChange={(e) => setForm({ ...form, signal: e.target.value })} rows={2} className={tInputCls + " resize-none"} placeholder="样机测试通过率 72%，目标 100%，已延期两个月" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--color-text-secondary)]">诊断</label>
            <textarea value={form.diagnosis ?? ""} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} rows={2} className={tInputCls + " resize-none"} placeholder="产品化能力缺口，非执行懈怠" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--color-text-secondary)]">建议</label>
            <textarea value={form.recommendation ?? ""} onChange={(e) => setForm({ ...form, recommendation: e.target.value })} rows={2} className={tInputCls + " resize-none"} placeholder="引入外部集成顾问，并行建立内部能力" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--color-text-secondary)]">关联假设</label>
              <input value={form.linkedAssumptionCode ?? ""} onChange={(e) => setForm({ ...form, linkedAssumptionCode: e.target.value || undefined })} className={tInputCls} placeholder="H2" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--color-text-secondary)]">关联 KR</label>
              <input value={form.linkedKr ?? ""} onChange={(e) => setForm({ ...form, linkedKr: e.target.value || undefined })} className={tInputCls} />
            </div>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md border border-[var(--surface-border)] px-4 py-1.5 text-sm hover:bg-black/[0.04]">取消</button>
          <button onClick={save} disabled={saving} className="rounded-md bg-[var(--color-accent)] px-4 py-1.5 text-sm text-white hover:opacity-90 disabled:opacity-50">
            {saving ? "保存中…" : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TensionDetail({ item, onEdit, onDelete }: { item: TensionItem; onEdit: () => void; onDelete: () => void }) {
  const meta = TENSION_META[item.tensionType];
  return (
    <div className={`rounded-lg border p-5 ${meta.bgColor} ${meta.borderColor}`}>
      <div className="mb-4 flex items-center gap-2">
        <span className="text-sm font-semibold" style={{ color: meta.color }}>{meta.label}</span>
        <span className="text-xs text-[var(--color-text-muted)]">·</span>
        <span className="text-sm">{item.projectName} ({item.projectCode})</span>
        <div className="ml-auto flex gap-3">
          <button onClick={onEdit} className="text-xs text-[var(--color-accent)] hover:underline">编辑</button>
          <button onClick={onDelete} className="text-xs text-[var(--signal-red)] hover:underline">删除</button>
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <div className="mb-1 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">表面信号</div>
          <p className="text-sm">{item.signal}</p>
        </div>
        <div>
          <div className="mb-1 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">根因诊断</div>
          <p className="text-sm">{item.diagnosis}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md border border-red-900/30 bg-red-900/10 p-3">
            <div className="mb-1 text-xs text-red-400">× 错误对策</div>
            <p className="text-xs text-[var(--color-text-muted)]">{meta.wrongResponse}</p>
          </div>
          <div className="rounded-md border border-green-900/30 bg-green-900/10 p-3">
            <div className="mb-1 text-xs text-green-400">→ 正确方向</div>
            <p className="text-xs">{item.recommendation}</p>
          </div>
        </div>
        {(item.linkedAssumptionCode || item.linkedKr) && (
          <div className="flex gap-2 text-xs text-[var(--color-text-muted)]">
            {item.linkedAssumptionCode && <span className="rounded bg-black/[0.04] px-1.5 py-0.5">→ 假设 {item.linkedAssumptionCode}</span>}
            {item.linkedKr && <span className="rounded bg-black/[0.04] px-1.5 py-0.5">→ KR: {item.linkedKr}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

export function TensionMap({ tensions }: { tensions: TensionItem[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string>(tensions[0]?.id ?? "");
  const [editItem, setEditItem] = useState<Partial<TensionItem> | null>(null);
  const selectedItem = tensions.find((t) => t.id === selected);

  const byType = (["capability", "direction", "adaptation", "resource"] as TensionType[]).map((type) => ({
    type,
    meta: TENSION_META[type],
    items: tensions.filter((t) => t.tensionType === type),
  }));

  const highCount = tensions.filter((t) => t.severity === "high").length;
  const dominant = byType.reduce((a, b) => a.items.length >= b.items.length ? a : b);

  async function remove(id: string) {
    if (!confirm("删除该张力项，确认？")) return;
    const r = await fetch(`/api/execution/tension?id=${id}`, { method: "DELETE" });
    if (r.ok) router.refresh();
  }

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="text-base font-semibold">战略-执行张力分析</h2>
          <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
            诊断执行失败的结构性原因 · 主导张力：
            <span className="ml-1 font-medium" style={{ color: dominant.meta.color }}>{dominant.meta.label}</span>
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
          {byType.map(({ type, meta, items }) => items.length > 0 && (
            <span key={type} className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: meta.color }} />
              {meta.label} {items.length}
            </span>
          ))}
          {highCount > 0 && <span className="text-red-400">{highCount} 项高风险</span>}
          <button onClick={() => setEditItem({})} className="rounded-md bg-[var(--color-accent)] px-2.5 py-1 text-white hover:opacity-90">+ 新增张力</button>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_1.4fr] gap-4">
        <div className="space-y-2">
          {tensions.map((t) => (
            <TensionCard key={t.id} item={t} active={selected === t.id} onClick={() => setSelected(t.id)} />
          ))}
          <div className="mt-3 rounded-lg border border-black/[0.06] bg-black/[0.02] p-3">
            <div className="mb-2 text-xs font-medium text-[var(--color-text-muted)]">张力理论说明</div>
            <div className="space-y-1.5">
              {byType.map(({ type, meta }) => (
                <div key={type} className="flex items-start gap-2 text-xs">
                  <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: meta.color }} />
                  <span className="text-[var(--color-text-muted)]"><span className="text-[var(--color-text-secondary)]">{meta.label}：</span>{meta.rootCause}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div>
          {selectedItem ? <TensionDetail item={selectedItem} onEdit={() => setEditItem(selectedItem)} onDelete={() => remove(selectedItem.id)} /> : (
            <div className="flex h-full items-center justify-center rounded-lg border border-black/10 text-sm text-[var(--color-text-muted)]">
              选择左侧项目查看分析
            </div>
          )}
        </div>
      </div>

      {editItem && (
        <TensionModal item={editItem} onClose={() => setEditItem(null)} onSaved={() => { setEditItem(null); router.refresh(); }} />
      )}
    </section>
  );
}
