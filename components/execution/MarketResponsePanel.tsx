"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { MarketEvidence, CompetitivePosition } from "@/lib/execution/market-response";

const VERDICT_META = {
  effective:        { label: "执行有效",   color: "var(--signal-green)", bg: "bg-green-900/20",  border: "border-green-500/30"  },
  assumption_failed:{ label: "假设失效",   color: "var(--signal-red)", bg: "bg-red-900/20",    border: "border-red-500/30"    },
  inconclusive:     { label: "证据不足",   color: "var(--signal-yellow)", bg: "bg-yellow-900/20", border: "border-yellow-500/30" },
  empty:            { label: "待录入",     color: "var(--color-text-secondary)", bg: "bg-black/[0.03]",  border: "border-[var(--surface-border)] border-dashed" },
} as const;

const inputCls = "w-full rounded-md border border-[var(--surface-border)] bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]";

function EvidenceCard({ item, onEdit }: { item: MarketEvidence; onEdit: (i: MarketEvidence) => void }) {
  const meta = VERDICT_META[item.verdict];
  if (item.verdict === "empty") {
    return (
      <div className={`rounded-lg border ${meta.border} ${meta.bg} px-4 py-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-text-secondary)]" />
            <span className="text-sm text-[var(--color-text-muted)]">{item.actionLabel}</span>
            {item.actionCode && <span className="rounded bg-black/[0.04] px-1.5 py-0.5 text-xs text-[var(--color-text-secondary)]">{item.actionCode}</span>}
          </div>
          <button onClick={() => onEdit(item)} className="text-xs text-[var(--color-accent)] hover:underline">录入反馈</button>
        </div>
        {item.linkedAssumptionCode && (
          <p className="mt-1.5 text-xs text-[var(--color-text-secondary)]">关联假设 {item.linkedAssumptionCode} · 市场反馈缺失，假设有效性无法评估</p>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-lg border ${meta.border} ${meta.bg} p-4`}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: meta.color }} />
            <span className="text-sm font-medium">{item.actionLabel}</span>
            {item.actionCode && <span className="rounded bg-black/[0.04] px-1.5 py-0.5 text-xs text-[var(--color-text-muted)]">{item.actionCode}</span>}
          </div>
          {item.linkedAssumptionCode && (
            <span className="ml-3.5 text-xs text-[var(--color-text-muted)]">假设 {item.linkedAssumptionCode}</span>
          )}
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <span className="rounded px-2 py-0.5 text-xs font-medium" style={{ color: meta.color, backgroundColor: meta.color + "20" }}>
            {meta.label}
          </span>
          <button onClick={() => onEdit(item)} className="text-xs text-[var(--color-accent)] hover:underline">编辑</button>
        </div>
      </div>
      <p className="text-sm leading-relaxed">{item.evidenceText}</p>
      {item.verdictNote && (
        <p className="mt-2 text-xs text-[var(--color-text-muted)]">→ {item.verdictNote}</p>
      )}
      <div className="mt-3 flex gap-3 text-xs text-[var(--color-text-secondary)]">
        {item.evidenceSource && <span>{item.evidenceSource}</span>}
        {item.recordedBy && <span>录入：{item.recordedBy}</span>}
        {item.recordedAt && <span>{item.recordedAt}</span>}
      </div>
    </div>
  );
}

function EvidenceModal({ item, onClose, onSaved }: {
  item: MarketEvidence; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState<MarketEvidence>({ ...item });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    setSaving(true); setErr("");
    try {
      const r = await fetch("/api/execution/market-evidence", {
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
        <h3 className="mb-4 text-base font-semibold text-[var(--color-text-primary)]">录入市场反馈 · {form.actionLabel}</h3>
        {err && <p className="mb-3 rounded bg-[var(--signal-red)]/10 px-3 py-2 text-sm text-[var(--signal-red)]">{err}</p>}
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--color-text-secondary)]">市场证据</label>
            <textarea value={form.evidenceText ?? ""} onChange={(e) => setForm({ ...form, evidenceText: e.target.value || null })} rows={3}
              placeholder="如：Q2 华东新签 62 家，同期史密斯约 300 家，渗透率 3.1%" className={inputCls + " resize-none"} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--color-text-secondary)]">执行判定</label>
            <select value={form.verdict} onChange={(e) => setForm({ ...form, verdict: e.target.value as MarketEvidence["verdict"] })} className={inputCls}>
              <option value="empty">待录入</option>
              <option value="effective">执行有效</option>
              <option value="assumption_failed">假设失效</option>
              <option value="inconclusive">证据不足</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--color-text-secondary)]">判定说明</label>
            <input value={form.verdictNote ?? ""} onChange={(e) => setForm({ ...form, verdictNote: e.target.value || null })} className={inputCls} placeholder="如：假设 H5 按当前速度无法兑现" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--color-text-secondary)]">来源</label>
              <input value={form.evidenceSource ?? ""} onChange={(e) => setForm({ ...form, evidenceSource: e.target.value || null })} className={inputCls} placeholder="销售周报 2026-06" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--color-text-secondary)]">录入人</label>
              <input value={form.recordedBy ?? ""} onChange={(e) => setForm({ ...form, recordedBy: e.target.value || null })} className={inputCls} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--color-text-secondary)]">采集日期</label>
            <input type="date" value={form.recordedAt ?? ""} onChange={(e) => setForm({ ...form, recordedAt: e.target.value || null })} className={inputCls} />
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

function PositionModal({ item, onClose, onSaved }: {
  item: CompetitivePosition; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState<CompetitivePosition>({ ...item });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    setSaving(true); setErr("");
    try {
      const r = await fetch("/api/execution/position", {
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
        <h3 className="mb-4 text-base font-semibold text-[var(--color-text-primary)]">录入竞争位移 · {form.dimension}</h3>
        {err && <p className="mb-3 rounded bg-[var(--signal-red)]/10 px-3 py-2 text-sm text-[var(--signal-red)]">{err}</p>}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--color-text-secondary)]">我方值</label>
              <input value={form.ourValue ?? ""} onChange={(e) => setForm({ ...form, ourValue: e.target.value || null })} className={inputCls} placeholder="62 家" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--color-text-secondary)]">竞品值</label>
              <input value={form.theirValue ?? ""} onChange={(e) => setForm({ ...form, theirValue: e.target.value || null })} className={inputCls} placeholder="约 300 家" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--color-text-secondary)]">差距</label>
            <input value={form.delta ?? ""} onChange={(e) => setForm({ ...form, delta: e.target.value || null })} className={inputCls} placeholder="落后 238 家 (-79%)" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--color-text-secondary)]">来源</label>
              <input value={form.evidenceSource ?? ""} onChange={(e) => setForm({ ...form, evidenceSource: e.target.value || null })} className={inputCls} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--color-text-secondary)]">录入人</label>
              <input value={form.recordedBy ?? ""} onChange={(e) => setForm({ ...form, recordedBy: e.target.value || null })} className={inputCls} />
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

function CompetitiveTable({ positions, onEdit }: {
  positions: CompetitivePosition[]; onEdit: (p: CompetitivePosition) => void;
}) {
  const filledCount = positions.filter((p) => p.ourValue && p.theirValue).length;
  const missingCount = positions.length - filledCount;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs text-[var(--color-text-muted)]">竞争位移对标</span>
        {missingCount > 0 && (
          <span className="text-xs text-[var(--color-text-secondary)]">{missingCount} 项对标数据缺失</span>
        )}
      </div>
      <div className="overflow-x-auto rounded-lg border border-[var(--surface-border)]">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-[var(--surface-border)] bg-black/[0.03]">
            <tr>
              <th className="px-3 py-2.5 font-normal text-[var(--color-text-muted)]">对标维度</th>
              <th className="px-3 py-2.5 font-normal text-[var(--color-text-muted)]">竞品</th>
              <th className="px-3 py-2.5 font-normal text-[var(--color-text-muted)]">我方</th>
              <th className="px-3 py-2.5 font-normal text-[var(--color-text-muted)]">竞品</th>
              <th className="px-3 py-2.5 font-normal text-[var(--color-text-muted)]">差距</th>
              <th className="px-3 py-2.5 font-normal text-[var(--color-text-muted)]">来源</th>
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {positions.map((p) => {
              const missing = !p.ourValue || !p.theirValue;
              return (
                <tr key={p.id} className={`border-b border-[var(--surface-border)] ${missing ? "bg-black/[0.015]" : ""}`}>
                  <td className="px-3 py-2.5">{p.dimension}</td>
                  <td className="px-3 py-2.5 text-[var(--color-text-muted)]">{p.competitor}</td>
                  <td className="px-3 py-2.5 font-medium">{p.ourValue ?? <span className="text-[var(--color-text-secondary)]">待录入</span>}</td>
                  <td className="px-3 py-2.5">{p.theirValue ?? <span className="text-[var(--color-text-secondary)]">待录入</span>}</td>
                  <td className="px-3 py-2.5">
                    {p.delta
                      ? <span className={p.delta.includes("落后") ? "text-red-400" : "text-green-400"}>{p.delta}</span>
                      : <span className="text-[var(--color-text-secondary)]">—</span>}
                  </td>
                  <td className="px-3 py-2.5 text-[var(--color-text-secondary)]">
                    {p.evidenceSource
                      ? <span>{p.evidenceSource} · {p.recordedBy}</span>
                      : <span className="italic">无来源</span>}
                  </td>
                  <td className="px-3 py-2.5">
                    <button onClick={() => onEdit(p)} className="text-xs text-[var(--color-accent)] hover:underline">{missing ? "录入" : "编辑"}</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function MarketResponsePanel({
  responses, positions,
}: {
  responses: MarketEvidence[];
  positions: CompetitivePosition[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"response" | "position">("response");
  const [editEvidence, setEditEvidence] = useState<MarketEvidence | null>(null);
  const [editPosition, setEditPosition] = useState<CompetitivePosition | null>(null);

  const emptyCount     = responses.filter((r) => r.verdict === "empty").length;
  const failedCount    = responses.filter((r) => r.verdict === "assumption_failed").length;
  const effectiveCount = responses.filter((r) => r.verdict === "effective").length;
  const totalSlots     = responses.length;

  const cpMissingCount = positions.filter((p) => !p.ourValue || !p.theirValue).length;

  function refresh() {
    setEditEvidence(null);
    setEditPosition(null);
    router.refresh();
  }

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold">市场-执行对照</h2>
          <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
            战略行动 × 市场反馈 × 假设验收 · 空白即预警——缺失数据反映对市场的把控程度
          </p>
        </div>
        <div className="flex gap-3 text-xs">
          {emptyCount > 0 && (
            <span className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-text-secondary)]" />
              {emptyCount}/{totalSlots} 待录入
            </span>
          )}
          {failedCount > 0 && (
            <span className="flex items-center gap-1.5 text-red-400">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
              {failedCount} 假设失效
            </span>
          )}
          {effectiveCount > 0 && (
            <span className="flex items-center gap-1.5 text-green-400">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
              {effectiveCount} 执行有效
            </span>
          )}
        </div>
      </div>

      {emptyCount > 0 && (
        <div className="rounded-lg border border-[var(--surface-border-strong)] bg-[var(--surface-raised)] px-4 py-3 text-xs text-[var(--color-text-muted)]">
          <span className="text-[var(--color-text-muted)]">{emptyCount} 个战略行动缺少市场反馈录入</span>
          {" "}— 战略会前要求责任人补录，缺失本身是对市场理解深度的考核。
          {cpMissingCount > 0 && <span> 竞争位移表另有 {cpMissingCount} 项对标数据缺失。</span>}
        </div>
      )}

      <div className="flex gap-1 border-b border-[var(--surface-border)] pb-0">
        {(["response", "position"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs transition-colors border-b-2 -mb-px ${
              tab === t ? "border-[var(--color-accent)] text-[var(--color-text-primary)]" : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            }`}>
            {t === "response" ? `市场反馈 (${totalSlots})` : `竞争位移 (${positions.length})`}
          </button>
        ))}
      </div>

      {tab === "response" && (
        <div className="space-y-3">
          {responses.map((r) => <EvidenceCard key={r.id} item={r} onEdit={setEditEvidence} />)}
        </div>
      )}
      {tab === "position" && <CompetitiveTable positions={positions} onEdit={setEditPosition} />}

      {editEvidence && <EvidenceModal item={editEvidence} onClose={() => setEditEvidence(null)} onSaved={refresh} />}
      {editPosition && <PositionModal item={editPosition} onClose={() => setEditPosition(null)} onSaved={refresh} />}
    </section>
  );
}
