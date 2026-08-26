import type { PostInvestDeviation, RealOptionTag } from "@/lib/types/stratos";
import { SectionCard } from "@/components/ui/KpiTile";

export function RealOptionsPanel({ options }: { options: RealOptionTag[] }) {
  return (
    <SectionCard title="Real Options · 分阶段投资" accent="teal" dense>
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
                <span className="rounded bg-[var(--signal-green)]/10 px-2 py-0.5 text-[var(--type-label)] text-[var(--signal-green-text)]">
                  放弃权
                </span>
              )}
            </div>
            <div className="mt-2 text-caption">{o.stageGate}</div>
            <div className="mt-2 flex flex-wrap gap-4 text-sm">
              <span>
                下期 commit{" "}
                <span className="font-data text-[var(--color-accent)]">
                  {o.nextCommitAmount} 万
                </span>
              </span>
            </div>
            <p className="mt-2 text-caption">{o.optionValueNote}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

export function PostInvestPanel({ deviations }: { deviations: PostInvestDeviation[] }) {
  return (
    <SectionCard title="投后偏离追踪 · CAPEX vs IRR" dense>
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
    </SectionCard>
  );
}

function StatusBadge({ status }: { status: PostInvestDeviation["status"] }) {
  const map = {
    on_track: { label: "正常", cls: "text-[var(--signal-green-text)] bg-[var(--signal-green)]/10" },
    watch: { label: "关注", cls: "text-[var(--signal-yellow-text)] bg-[var(--signal-yellow)]/10" },
    critical: { label: "临界", cls: "text-[var(--fpa-kpi-negative)] bg-[color-mix(in_srgb,var(--signal-red)_20%,transparent)]" },
  };
  const { label, cls } = map[status];
  return (
    <span className={`rounded px-2 py-0.5 text-xs ${cls}`}>{label}</span>
  );
}
