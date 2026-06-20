"use client";
import { useMemo, useState } from "react";
import type { CommitmentRecord } from "@/lib/execution/tension-analysis";

const STATUS_META = {
  completed:   { label: "已完成", color: "#22c55e", bg: "bg-green-900/20",  border: "border-green-500/30"  },
  overdue:     { label: "逾期",   color: "#ef4444", bg: "bg-red-900/20",    border: "border-red-500/30"    },
  in_progress: { label: "进行中", color: "#3b82f6", bg: "bg-blue-900/20",   border: "border-blue-500/30"   },
  pending:     { label: "待启动", color: "#828c8d", bg: "bg-black/[0.04]",       border: "border-black/10"      },
} as const;

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
  const [filter, setFilter] = useState<CommitmentRecord["status"] | "all">("all");

  const stats = useMemo(() => ({
    total:       records.length,
    completed:   records.filter((r) => r.status === "completed").length,
    overdue:     records.filter((r) => r.status === "overdue").length,
    in_progress: records.filter((r) => r.status === "in_progress").length,
    pending:     records.filter((r) => r.status === "pending").length,
  }), [records]);

  const fulfillmentRate = Math.round(stats.completed / stats.total * 100);

  // 承诺逾期 × 假设关联分析
  const assumptionLinked = records.filter((r) => r.status === "overdue" && r.linkedAssumptionCode);

  const filtered = filter === "all" ? records : records.filter((r) => r.status === filter);

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
            </div>
          );
        })}
      </div>
    </section>
  );
}
