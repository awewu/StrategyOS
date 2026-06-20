"use client";
import { useState } from "react";
import { TENSION_META, type TensionItem, type TensionType } from "@/lib/execution/tension-analysis";

const SEV_COLOR = { high: "bg-red-500", medium: "bg-yellow-500", low: "bg-green-500" } as const;
const SEV_LABEL = { high: "高", medium: "中", low: "低" } as const;

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

function TensionDetail({ item }: { item: TensionItem }) {
  const meta = TENSION_META[item.tensionType];
  return (
    <div className={`rounded-lg border p-5 ${meta.bgColor} ${meta.borderColor}`}>
      <div className="mb-4 flex items-center gap-2">
        <span className="text-sm font-semibold" style={{ color: meta.color }}>{meta.label}</span>
        <span className="text-xs text-[var(--color-text-muted)]">·</span>
        <span className="text-sm">{item.projectName} ({item.projectCode})</span>
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
  const [selected, setSelected] = useState<string>(tensions[0]?.id ?? "");
  const selectedItem = tensions.find((t) => t.id === selected);

  const byType = (["capability", "direction", "adaptation", "resource"] as TensionType[]).map((type) => ({
    type,
    meta: TENSION_META[type],
    items: tensions.filter((t) => t.tensionType === type),
  }));

  const highCount = tensions.filter((t) => t.severity === "high").length;
  const dominant = byType.reduce((a, b) => a.items.length >= b.items.length ? a : b);

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
        <div className="flex gap-3 text-xs text-[var(--color-text-muted)]">
          {byType.map(({ type, meta, items }) => items.length > 0 && (
            <span key={type} className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: meta.color }} />
              {meta.label} {items.length}
            </span>
          ))}
          {highCount > 0 && <span className="text-red-400">{highCount} 项高风险</span>}
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
          {selectedItem ? <TensionDetail item={selectedItem} /> : (
            <div className="flex h-full items-center justify-center rounded-lg border border-black/10 text-sm text-[var(--color-text-muted)]">
              选择左侧项目查看分析
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
