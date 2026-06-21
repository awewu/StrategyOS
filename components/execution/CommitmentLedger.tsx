"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { CommitmentRecord } from "@/lib/execution/tension-analysis";

const STATUS_META = {
  completed:   { label: "已完成", color: "#22c55e", bg: "bg-green-900/20",  border: "border-green-500/30"  },
  overdue:     { label: "逾期",   color: "#ef4444", bg: "bg-red-900/20",    border: "border-red-500/30"    },
  in_progress: { label: "进行中", color: "#3b82f6", bg: "bg-blue-900/20",   border: "border-blue-500/30"   },
  pending:     { label: "待启动", color: "#828c8d", bg: "bg-black/[0.04]",       border: "border-black/10"      },
} as const;
const cInputCls = "w-full rounded-md border border-[var(--surface-border)] bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]";

function CommitmentModal({ item, onClose, onSaved }: {
  item: Partial<CommitmentRecord>; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState<Partial<CommitmentRecord> & { ownerName?: string }>({
    status: "pending", ownerName: item.owner, ...item,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    setSaving(true); setErr("");
    try {
      const r = await fetch("/api/execution/commitment", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          ownerName: form.ownerName ?? form.owner,
          department: form.department,
          content: form.content,
          deadline: form.deadline,
          status: form.status,
          linkedProjectCode: form.linkedProjectCode,
          linkedAssumptionCode: form.linkedAssumptionCode,
        }),
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
        <h3 className="mb-4 text-base font-semibold text-[var(--color-text-primary)]">{item.id ? "编辑承诺" : "新增承诺"}</h3>
        {err && <p className="mb-3 rounded bg-[var(--signal-red)]/10 px-3 py-2 text-sm text-[var(--signal-red)]">{err}</p>}
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--color-text-secondary)]">承诺内容 *</label>
            <textarea value={form.content ?? ""} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={2} className={cInputCls + " resize-none"} placeholder="V4 样机完成 EMC 测试" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--color-text-secondary)]">负责人 *</label>
              <input value={form.ownerName ?? ""} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} className={cInputCls} placeholder="张健" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--color-text-secondary)]">部门</label>
              <input value={form.department ?? ""} onChange={(e) => setForm({ ...form, department: e.target.value })} className={cInputCls} placeholder="研发中心" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--color-text-secondary)]">截止日期 *</label>
              <input type="date" value={form.deadline ?? ""} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className={cInputCls} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--color-text-secondary)]">状态</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as CommitmentRecord["status"] })} className={cInputCls}>
                <option value="pending">待启动</option>
                <option value="in_progress">进行中</option>
                <option value="completed">已完成</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--color-text-secondary)]">关联项目</label>
              <input value={form.linkedProjectCode ?? ""} onChange={(e) => setForm({ ...form, linkedProjectCode: e.target.value || undefined })} className={cInputCls} placeholder="V4" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--color-text-secondary)]">关联假设</label>
              <input value={form.linkedAssumptionCode ?? ""} onChange={(e) => setForm({ ...form, linkedAssumptionCode: e.target.value || undefined })} className={cInputCls} placeholder="H5" />
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

function OwnerHeatmap({ records }: { records: CommitmentRecord[] }) {
  const owners = Array.from(new Set(records.map((r) => r.owner)));
  const deadlines = Array.from(new Set(records.map((r) => r.deadline))).sort();

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="pb-2 pr-4 text-left font-normal text-[var(--color-text-muted)]">负责人</th>
            {deadlines.map((d) => (
              <th key={d} className="pb-2 px-2 text-center font-normal text-[var(--color-text-muted)]">{d}</th>
            ))}
            <th className="pb-2 pl-4 text-right font-normal text-[var(--color-text-muted)]">逾期率</th>
          </tr>
        </thead>
        <tbody>
          {owners.map((owner) => {
            const ownerRecs = records.filter((r) => r.owner === owner);
            const overdueCount = ownerRecs.filter((r) => r.status === "overdue").length;
            const overdueRate = ownerRecs.length ? Math.round(overdueCount / ownerRecs.length * 100) : 0;
            return (
              <tr key={owner} className="border-t border-black/[0.06]">
                <td className="py-2 pr-4 font-medium">{owner}</td>
                {deadlines.map((d) => {
                  const cell = ownerRecs.filter((r) => r.deadline === d);
                  if (!cell.length) return <td key={d} className="px-2 text-center text-[var(--color-text-muted)]">—</td>;
                  const hasOverdue = cell.some((r) => r.status === "overdue");
                  const allDone  = cell.every((r) => r.status === "completed");
                  return (
                    <td key={d} className="px-2 text-center">
                      <span className={`inline-block h-5 w-5 rounded text-xs leading-5 font-medium ${
                        hasOverdue ? "bg-red-900/40 text-red-400" : allDone ? "bg-green-900/30 text-green-400" : "bg-blue-900/30 text-blue-400"
                      }`}>
                        {cell.length}
                      </span>
                    </td>
                  );
                })}
                <td className="py-2 pl-4 text-right">
                  <span className={overdueRate > 30 ? "text-red-400" : overdueRate > 0 ? "text-yellow-400" : "text-green-400"}>
                    {overdueRate}%
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function CommitmentLedger({ records }: { records: CommitmentRecord[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<CommitmentRecord["status"] | "all">("all");
  const [editItem, setEditItem] = useState<Partial<CommitmentRecord> | null>(null);

  const stats = useMemo(() => ({
    total:       records.length,
    completed:   records.filter((r) => r.status === "completed").length,
    overdue:     records.filter((r) => r.status === "overdue").length,
    in_progress: records.filter((r) => r.status === "in_progress").length,
    pending:     records.filter((r) => r.status === "pending").length,
  }), [records]);

  const fulfillmentRate = stats.total ? Math.round(stats.completed / stats.total * 100) : 0;

  // 承诺逾期 × 假设关联分析
  const assumptionLinked = records.filter((r) => r.status === "overdue" && r.linkedAssumptionCode);

  const filtered = filter === "all" ? records : records.filter((r) => r.status === filter);

  async function remove(id: string) {
    if (!confirm("删除该承诺，确认？")) return;
    const r = await fetch(`/api/execution/commitment?id=${id}`, { method: "DELETE" });
    if (r.ok) router.refresh();
  }

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="text-base font-semibold">承诺账本分析</h2>
          <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
            逾期模式热力图 · 责任人追溯 · 承诺-假设联动预警
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-[var(--color-text-muted)]">兑现率</span>
          <span className={`font-data text-xl ${fulfillmentRate >= 70 ? "text-green-400" : fulfillmentRate >= 50 ? "text-yellow-400" : "text-red-400"}`}>
            {fulfillmentRate}%
          </span>
          <button onClick={() => setEditItem({})} className="rounded-md bg-[var(--color-accent)] px-2.5 py-1 text-white hover:opacity-90">+ 新增承诺</button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex gap-2">
        {(["all", "overdue", "in_progress", "completed", "pending"] as const).map((s) => {
          const count = s === "all" ? stats.total : stats[s];
          const meta = s === "all" ? null : STATUS_META[s];
          return (
            <button key={s} onClick={() => setFilter(s)}
              className={`rounded-md px-3 py-1.5 text-xs transition-colors ${filter === s ? "bg-black/[0.08] text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"}`}>
              {s === "all" ? `全部 ${count}` : <span style={{ color: meta?.color }}>{meta?.label} {count}</span>}
            </button>
          );
        })}
      </div>

      {/* Heatmap */}
      <div className="rounded-lg border border-black/10 bg-[var(--color-bg-surface)] p-4">
        <div className="mb-3 text-xs font-medium text-[var(--color-text-muted)]">逾期模式热力图（责任人 × 时段）</div>
        <OwnerHeatmap records={records} />
      </div>

      {/* Assumption linkage warning */}
      {assumptionLinked.length > 0 && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-900/10 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-yellow-400">
            <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
            承诺逾期 × 假设联动预警
          </div>
          <div className="space-y-2">
            {assumptionLinked.map((r) => (
              <div key={r.id} className="flex items-start gap-3 text-xs">
                <span className="text-[var(--color-text-muted)]">{r.owner}</span>
                <span className="flex-1">{r.content}</span>
                <span className="text-yellow-400 flex-shrink-0">→ 假设 {r.linkedAssumptionCode} 风险上升</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-2">
        {filtered.map((r) => {
          const meta = STATUS_META[r.status];
          return (
            <div key={r.id} className={`flex items-center gap-4 rounded-lg border p-3 text-sm ${meta.bg} ${meta.border}`}>
              <span className="w-16 flex-shrink-0 text-xs font-medium" style={{ color: meta.color }}>{meta.label}</span>
              <span className="flex-1">{r.content}</span>
              <span className="w-20 flex-shrink-0 text-xs text-[var(--color-text-muted)]">{r.owner}</span>
              <span className="w-20 flex-shrink-0 text-xs text-[var(--color-text-muted)]">{r.deadline}</span>
              {r.daysOverdue && <span className="w-16 flex-shrink-0 text-xs text-red-400">逾期 {r.daysOverdue}天</span>}
              {r.linkedProjectCode && <span className="text-xs text-[var(--color-text-muted)]">→ {r.linkedProjectCode}</span>}
              <span className="flex flex-shrink-0 gap-2">
                <button onClick={() => setEditItem(r)} className="text-xs text-[var(--color-accent)] hover:underline">编辑</button>
                <button onClick={() => remove(r.id)} className="text-xs text-[var(--signal-red)] hover:underline">删</button>
              </span>
            </div>
          );
        })}
      </div>

      {editItem && (
        <CommitmentModal item={editItem} onClose={() => setEditItem(null)} onSaved={() => { setEditItem(null); router.refresh(); }} />
      )}
    </section>
  );
}
