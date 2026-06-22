import type { Project } from "@/lib/types/stratos";
import { CynefinBadge } from "@/components/ui/CynefinBadge";

export function VxBoard({ projects }: { projects: Project[] }) {
  return (
    <section className="overflow-x-auto rounded-lg border border-[var(--surface-border)]">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-[var(--surface-border)] bg-[var(--surface-panel)] text-[#828c8d]">
          <tr>
            <th className="px-4 py-3">Vx</th>
            <th className="px-4 py-3">进度</th>
            <th className="px-4 py-3">预算</th>
              <th className="px-4 py-3">域</th>
              <th className="px-4 py-3">层面</th>
              <th className="px-4 py-3">负责人</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((vx) => {
            const budgetPct = vx.budgetTotal
              ? Math.round((vx.budgetSpent / vx.budgetTotal) * 100)
              : 0;
            return (
              <tr key={vx.id} className="border-b border-[var(--surface-border)] hover:bg-black/[0.02]">
                <td className="px-4 py-3">
                  <div className="font-medium">{vx.code}</div>
                  <div className="text-xs text-[#828c8d]">{vx.name}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-data">{vx.progressPercent}%</div>
                  <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-black/[0.06]">
                    <div
                      className={`h-full ${vx.riskLevel === "high" ? "bg-[#8b0e04]" : "bg-[#1f8a45]"}`}
                      style={{ width: `${vx.progressPercent}%` }}
                    />
                  </div>
                </td>
                <td className="px-4 py-3 font-data text-xs">
                  {vx.budgetSpent}/{vx.budgetTotal} 万 ({budgetPct}%)
                </td>
                <td className="px-4 py-3">
                  <CynefinBadge domain={vx.cynefinDomain} />
                </td>
                <td className="px-4 py-3 font-data text-xs text-[var(--color-text-muted)]">
                  {vx.horizon ?? "—"}
                </td>
                <td className="px-4 py-3 text-[#828c8d]">{vx.owner}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
