import Link from "next/link";
import type { ReportSignal } from "@/lib/data/strategy-data";

const SEVERITY_META: Record<ReportSignal["severity"], { label: string; color: string; bg: string; border: string }> = {
  high:   { label: "高", color: "var(--signal-red)",   bg: "bg-red-600/[0.06]",    border: "border-red-600/25" },
  medium: { label: "中", color: "var(--color-accent)", bg: "bg-[var(--color-accent-dim)]", border: "border-[var(--color-accent)]/25" },
  low:    { label: "低", color: "#4e5758",             bg: "bg-black/[0.03]",      border: "border-black/10" },
};

export function ReportSignalsPanel({ signals }: { signals: ReportSignal[] }) {
  return (
    <section className="rounded-lg border border-black/10 bg-[var(--color-bg-surface)] p-5">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium text-[var(--color-text-primary)]">
            报告反哺信号 · 来自已存档经营报告
          </h2>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            各部门已确认存档的报告经 AI 解析后，自动提取红线触发与战略模式信号，反哺执行审计
          </p>
        </div>
        <Link href="/reports" className="text-xs text-[var(--color-accent)] hover:underline">
          报告中心 →
        </Link>
      </header>

      {signals.length === 0 ? (
        <div className="rounded-md border border-dashed border-black/10 py-8 text-center">
          <p className="text-xs text-[var(--color-text-muted)]">
            暂无已存档报告产生的信号 · 在报告中心上传并存档报告后，红线与战略模式信号将在此汇聚
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {signals.map((s, i) => {
            const meta = SEVERITY_META[s.severity];
            return (
              <li
                key={`${s.reportId}-${i}`}
                className={`flex flex-wrap items-start gap-3 rounded-md border ${meta.border} ${meta.bg} px-3 py-2.5`}
              >
                <span
                  className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-[10px] font-semibold text-white"
                  style={{ backgroundColor: meta.color }}
                  title={`严重度 ${meta.label}`}
                >
                  {meta.label}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-[var(--color-text-primary)]">{s.label}</span>
                    {s.orgUnitName && (
                      <span className="text-[11px] text-[var(--color-text-muted)]">{s.orgUnitName}</span>
                    )}
                    <span className="text-[11px] text-[var(--color-text-muted)]">{s.period}</span>
                  </div>
                  <p className="mt-0.5 text-sm leading-relaxed text-[var(--color-text-primary)]">{s.detail}</p>
                  <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
                    来源：{s.reportTitle} · {s.uploadedAt}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
