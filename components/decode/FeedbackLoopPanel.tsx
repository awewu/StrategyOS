import type { FeedbackLoop } from "@/lib/types/stratos";

const KIND_STYLE: Record<string, { bg: string; label: string }> = {
  R: { bg: "bg-emerald-500/20 text-emerald-400", label: "增强环 R" },
  B: { bg: "bg-amber-500/20 text-amber-400", label: "调节环 B" },
  D: { bg: "bg-sky-500/20 text-sky-400", label: "延迟 D" },
};

export function FeedbackLoopPanel({ loops }: { loops: FeedbackLoop[] }) {
  return (
    <section className="rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-6">
      <h2 className="mb-2 text-sm font-medium text-[var(--color-text-muted)]">
        系统反馈环 · R/B/D
      </h2>
      <p className="mb-4 text-xs text-[var(--color-text-muted)]">
        BSC 关键链标注 · 增强环勿过度乐观 · 调节环联动 FPA
      </p>
      <div className="grid gap-3 md:grid-cols-3">
        {loops.map((loop) => {
          const style = KIND_STYLE[loop.kind];
          return (
            <div key={loop.id} className="rounded border border-[var(--surface-border)] p-4">
              <div className="flex items-center gap-2">
                <span className={`rounded px-2 py-0.5 text-[10px] font-medium ${style.bg}`}>
                  {style.label}
                </span>
                <span className="text-xs text-[var(--color-text-muted)]">{loop.bscDimension}</span>
              </div>
              <div className="mt-2 text-sm font-medium">{loop.label}</div>
              <p className="mt-1 font-mono text-xs text-[var(--color-text-muted)]">{loop.chain}</p>
              {loop.fpaLinked && (
                <span className="mt-2 inline-block text-[10px] text-[var(--color-accent)]">
                  ↔ FPA 联动
                </span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
