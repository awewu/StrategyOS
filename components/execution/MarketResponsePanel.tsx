"use client";
import { useState } from "react";
import type { MarketEvidence, CompetitivePosition } from "@/lib/execution/market-response";

const VERDICT_META = {
  effective:        { label: "执行有效",   color: "#22c55e", bg: "bg-green-900/20",  border: "border-green-500/30"  },
  assumption_failed:{ label: "假设失效",   color: "#ef4444", bg: "bg-red-900/20",    border: "border-red-500/30"    },
  inconclusive:     { label: "证据不足",   color: "#eab308", bg: "bg-yellow-900/20", border: "border-yellow-500/30" },
  empty:            { label: "待录入",     color: "#4e5758", bg: "bg-black/[0.03]",  border: "border-black/10 border-dashed" },
} as const;

function EmptySlot({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-dashed border-black/12 bg-black/[0.02] px-4 py-3">
      <span className="h-2 w-2 rounded-full bg-black/15 flex-shrink-0" />
      <span className="flex-1 text-sm text-[#4e5758]">{label}</span>
      <span className="rounded bg-black/[0.04] px-2 py-0.5 text-xs text-[#4e5758]">待录入</span>
    </div>
  );
}

function EvidenceCard({ item }: { item: MarketEvidence }) {
  const meta = VERDICT_META[item.verdict];
  if (item.verdict === "empty") {
    return (
      <div className={`rounded-lg border ${meta.border} ${meta.bg} px-4 py-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#4e5758]" />
            <span className="text-sm text-[#828c8d]">{item.actionLabel}</span>
            {item.actionCode && <span className="rounded bg-black/[0.04] px-1.5 py-0.5 text-xs text-[#4e5758]">{item.actionCode}</span>}
          </div>
          <span className="text-xs text-[#4e5758]">待录入</span>
        </div>
        {item.linkedAssumptionCode && (
          <p className="mt-1.5 text-xs text-[#4e5758]">关联假设 {item.linkedAssumptionCode} · 市场反馈缺失，假设有效性无法评估</p>
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
        <span className="flex-shrink-0 rounded px-2 py-0.5 text-xs font-medium" style={{ color: meta.color, backgroundColor: meta.color + "20" }}>
          {meta.label}
        </span>
      </div>
      <p className="text-sm leading-relaxed">{item.evidenceText}</p>
      {item.verdictNote && (
        <p className="mt-2 text-xs text-[var(--color-text-muted)]">→ {item.verdictNote}</p>
      )}
      <div className="mt-3 flex gap-3 text-xs text-[#4e5758]">
        {item.evidenceSource && <span>{item.evidenceSource}</span>}
        {item.recordedBy && <span>录入：{item.recordedBy}</span>}
        {item.recordedAt && <span>{item.recordedAt}</span>}
      </div>
    </div>
  );
}

function CompetitiveTable({ positions }: { positions: CompetitivePosition[] }) {
  const filledCount = positions.filter((p) => p.ourValue && p.theirValue).length;
  const missingCount = positions.length - filledCount;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs text-[var(--color-text-muted)]">竞争位移对标</span>
        {missingCount > 0 && (
          <span className="text-xs text-[#4e5758]">{missingCount} 项对标数据缺失</span>
        )}
      </div>
      <div className="overflow-x-auto rounded-lg border border-black/10">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-black/10 bg-black/[0.03]">
            <tr>
              <th className="px-3 py-2.5 font-normal text-[var(--color-text-muted)]">对标维度</th>
              <th className="px-3 py-2.5 font-normal text-[var(--color-text-muted)]">竞品</th>
              <th className="px-3 py-2.5 font-normal text-[var(--color-text-muted)]">我方</th>
              <th className="px-3 py-2.5 font-normal text-[var(--color-text-muted)]">竞品</th>
              <th className="px-3 py-2.5 font-normal text-[var(--color-text-muted)]">差距</th>
              <th className="px-3 py-2.5 font-normal text-[var(--color-text-muted)]">来源</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((p) => {
              const missing = !p.ourValue || !p.theirValue;
              return (
                <tr key={p.id} className={`border-b border-black/[0.06] ${missing ? "bg-black/[0.015]" : ""}`}>
                  <td className="px-3 py-2.5">{p.dimension}</td>
                  <td className="px-3 py-2.5 text-[var(--color-text-muted)]">{p.competitor}</td>
                  <td className="px-3 py-2.5 font-medium">{p.ourValue ?? <span className="text-[#4e5758]">待录入</span>}</td>
                  <td className="px-3 py-2.5">{p.theirValue ?? <span className="text-[#4e5758]">待录入</span>}</td>
                  <td className="px-3 py-2.5">
                    {p.delta
                      ? <span className={p.delta.includes("落后") ? "text-red-400" : "text-green-400"}>{p.delta}</span>
                      : <span className="text-[#4e5758]">—</span>}
                  </td>
                  <td className="px-3 py-2.5 text-[#4e5758]">
                    {p.evidenceSource
                      ? <span>{p.evidenceSource} · {p.recordedBy}</span>
                      : <span className="italic">无来源</span>}
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
  const [tab, setTab] = useState<"response" | "position">("response");

  const emptyCount     = responses.filter((r) => r.verdict === "empty").length;
  const failedCount    = responses.filter((r) => r.verdict === "assumption_failed").length;
  const effectiveCount = responses.filter((r) => r.verdict === "effective").length;
  const totalSlots     = responses.length;

  const cpMissingCount = positions.filter((p) => !p.ourValue || !p.theirValue).length;

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
            <span className="flex items-center gap-1.5 text-[#4e5758]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#4e5758]" />
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
        <div className="rounded-lg border border-[#cdd1d2] bg-[var(--surface-raised)] px-4 py-3 text-xs text-[#828c8d]">
          <span className="text-[var(--color-text-muted)]">{emptyCount} 个战略行动缺少市场反馈录入</span>
          {" "}— 战略会前要求责任人补录，缺失本身是对市场理解深度的考核。
          {cpMissingCount > 0 && <span> 竞争位移表另有 {cpMissingCount} 项对标数据缺失。</span>}
        </div>
      )}

      <div className="flex gap-1 border-b border-black/10 pb-0">
        {(["response", "position"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs transition-colors border-b-2 -mb-px ${
              tab === t ? "border-[var(--color-accent-gold)] text-[var(--color-text-primary)]" : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            }`}>
            {t === "response" ? `市场反馈 (${totalSlots})` : `竞争位移 (${positions.length})`}
          </button>
        ))}
      </div>

      {tab === "response" && (
        <div className="space-y-3">
          {responses.map((r) => <EvidenceCard key={r.id} item={r} />)}
        </div>
      )}
      {tab === "position" && <CompetitiveTable positions={positions} />}
    </section>
  );
}
