import type { PostInvestDeviation, RealOptionTag } from "@/lib/types/stratos";

export function RealOptionsPanel({ options }: { options: RealOptionTag[] }) {
  return (
    <section className="rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-6">
      <h3 className="mb-4 text-sm font-medium text-[var(--color-accent)]">
        Real Options · 分阶段投资
      </h3>
      <div className="space-y-3">
        {options.map((o) => (
          <div
            key={o.icCode}
            className="rounded border border-[var(--surface-border)] p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <span className="font-data text-xs text-[var(--color-accent)]">{o.icCode}</span>
                <div className="text-sm font-medium">{o.title}</div>
              </div>
              {o.abandonRight && (
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-400">
                  放弃权
                </span>
              )}
            </div>
            <div className="mt-2 text-xs text-[var(--color-text-muted)]">{o.stageGate}</div>
            <div className="mt-2 flex flex-wrap gap-4 text-sm">
              <span>
                下期 commit{" "}
                <span className="font-data text-[var(--color-accent)]">
                  {o.nextCommitAmount} 万
                </span>
              </span>
            </div>
            <p className="mt-2 text-xs text-[var(--color-text-muted)]">{o.optionValueNote}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function PostInvestPanel({ deviations }: { deviations: PostInvestDeviation[] }) {
  return (
    <section className="rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-6">
      <h3 className="mb-4 text-sm font-medium text-[var(--color-text-muted)]">
        投后偏离追踪 · CAPEX vs IRR
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="text-[var(--color-text-muted)]">
            <tr>
              <th className="pb-2">IC</th>
              <th className="pb-2">批准/实际 CAPEX</th>
              <th className="pb-2">IRR 预期/实际</th>
              <th className="pb-2">偏离</th>
              <th className="pb-2">状态</th>
            </tr>
          </thead>
          <tbody>
            {deviations.map((d) => (
              <tr key={d.icCode} className="border-t border-[var(--surface-border)]">
                <td className="py-3">
                  <div className="font-data text-xs text-[var(--color-accent)]">{d.icCode}</div>
                  <div>{d.title}</div>
                </td>
                <td className="py-3 font-data">
                  {d.approvedCapex} / {d.actualCapex}
                </td>
                <td className="py-3 font-data">
                  {d.expectedIrr}% / {d.actualIrr ?? "—"}%
                </td>
                <td
                  className={`py-3 font-data ${d.deviationPct > 10 ? "text-[var(--fpa-kpi-negative)]" : ""}`}
                >
                  {d.deviationPct > 0 ? "+" : ""}
                  {d.deviationPct}%
                </td>
                <td className="py-3">
                  <StatusBadge status={d.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function StatusBadge({ status }: { status: PostInvestDeviation["status"] }) {
  const map = {
    on_track: { label: "正常", cls: "text-emerald-400 bg-emerald-500/20" },
    watch: { label: "关注", cls: "text-amber-400 bg-amber-500/20" },
    critical: { label: "临界", cls: "text-[var(--fpa-kpi-negative)] bg-[color-mix(in_srgb,var(--signal-red)_20%,transparent)]" },
  };
  const { label, cls } = map[status];
  return (
    <span className={`rounded px-2 py-0.5 text-xs ${cls}`}>{label}</span>
  );
}
