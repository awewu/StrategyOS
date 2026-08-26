import Link from "next/link";
import { CommitmentQuickActions } from "@/components/cockpit/CommitmentQuickActions";
import { computeCommitmentSummary, fulfillmentRateColor } from "@/lib/execution/commitment-summary";
import type { CommitmentRecord } from "@/lib/execution/tension-analysis";

type Group = "overdue" | "inflight" | "done";

const STATUS_META: Record<Group, { label: string; color: string; bg: string; border: string }> = {
  overdue: { label: "逾期", color: "var(--signal-red-text)", bg: "bg-[color-mix(in_srgb,var(--signal-red)_6%,white)]", border: "border-[var(--signal-red)]/30" },
  inflight: { label: "在途", color: "var(--color-accent)", bg: "bg-[color-mix(in_srgb,var(--color-accent)_5%,white)]", border: "border-[var(--surface-border)]" },
  done: { label: "已完成", color: "var(--signal-green-text)", bg: "bg-[color-mix(in_srgb,var(--signal-green)_6%,white)]", border: "border-[var(--signal-green)]/25" },
};

function groupOf(c: CommitmentRecord): Group {
  if (c.status === "overdue") return "overdue";
  if (c.status === "completed") return "done";
  return "inflight";
}

function CommitmentRow({ c }: { c: CommitmentRecord }) {
  const g = groupOf(c);
  const meta = STATUS_META[g];
  return (
    <div className={`flex items-center gap-4 rounded-lg border p-3 text-sm ${meta.bg} ${meta.border}`}>
      <span className="w-14 flex-shrink-0 text-xs font-medium" style={{ color: meta.color }}>{meta.label}</span>
      <span className="flex-1">{c.content}</span>
      <span className="w-24 flex-shrink-0 text-caption">对 {c.promiseTo ?? c.department}</span>
      <span className="w-20 flex-shrink-0 text-caption">{c.deadline}</span>
      {c.daysOverdue ? <span className="w-16 flex-shrink-0 text-xs text-[var(--signal-red-text)]">逾期 {c.daysOverdue}天</span> : <span className="w-16 flex-shrink-0" />}
      {c.linkedKrId ? (
        <span className="text-xs text-[var(--color-accent)]" title="已挂 KR → BSC 脊梁">↳ KR</span>
      ) : c.linkedProjectCode ? (
        <span className="text-caption">→ {c.linkedProjectCode}</span>
      ) : (
        <span className="w-8" />
      )}
      <CommitmentQuickActions id={c.id} status={c.status} />
    </div>
  );
}

export function CommitmentCockpit({
  commitments,
  sliceLabel,
  myName,
}: {
  commitments: CommitmentRecord[];
  sliceLabel?: string;
  myName?: string;
}) {
  const summary = computeCommitmentSummary(commitments);
  const rateColor = fulfillmentRateColor(summary.rate);
  const overdue = commitments.filter((c) => c.status === "overdue");

  const mine = myName ? commitments.filter((c) => c.owner === myName) : [];
  const team = commitments.filter((c) => !myName || c.owner !== myName);

  // 我团队欠的：按 owner 聚合
  const owners = Array.from(new Set(team.map((c) => c.owner)));
  const teamByOwner = owners
    .map((owner) => {
      const recs = team.filter((c) => c.owner === owner);
      const od = recs.filter((c) => c.status === "overdue").length;
      const dn = recs.filter((c) => c.status === "completed").length;
      return { owner, total: recs.length, overdue: od, done: dn, rate: recs.length ? Math.round((dn / recs.length) * 100) : 0 };
    })
    .sort((a, b) => b.overdue - a.overdue);

  return (
    <section className="space-y-6">
      {/* Header · 兑现率 */}
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">承诺兑现{sliceLabel ? ` · ${sliceLabel}` : ""}</h2>
          <p className="mt-0.5 text-caption">坚守驾驶舱 · 逾期即示警 · 承诺挂 KR 冒泡 BSC</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[var(--color-text-muted)]">本片兑现率</span>
          <span className="font-data text-2xl tabular-nums" style={{ color: rateColor }}>{summary.rate}%</span>
          <span className="text-[var(--color-text-muted)]">· {summary.done}/{summary.total}</span>
        </div>
      </div>

      {/* Row 0 · 逾期硬条 */}
      {overdue.length > 0 ? (
        <div className="rounded-xl border border-[var(--signal-red)]/35 bg-[color-mix(in_srgb,var(--signal-red)_7%,white)] p-4">
          <p className="text-label text-[var(--signal-red-text)]">
            坚守告警 · {overdue.length} 项承诺已逾期{summary.maxDaysOverdue ? ` · 最长 ${summary.maxDaysOverdue} 天` : ""}
          </p>
          <div className="mt-3 space-y-2">
            {overdue.map((c) => (
              <CommitmentRow key={c.id} c={c} />
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--signal-green)]/25 bg-[color-mix(in_srgb,var(--signal-green)_5%,white)] p-4 text-sm text-[var(--color-text-secondary)]">
          无逾期承诺 · 本片坚守到位
        </div>
      )}

      {/* 我的承诺 */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-[var(--color-text-primary)]">
          我的承诺{myName ? ` · ${myName}` : ""} <span className="text-caption">({mine.length})</span>
        </h3>
        {mine.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">暂无归属你的承诺记录。</p>
        ) : (
          <div className="space-y-2">
            {mine.map((c) => (
              <CommitmentRow key={c.id} c={c} />
            ))}
          </div>
        )}
      </div>

      {/* 我团队欠的 */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-[var(--color-text-primary)]">
          我团队欠的 <span className="text-caption">(责任人 × 兑现)</span>
        </h3>
        {teamByOwner.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">本片无其他责任人的承诺。</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[var(--surface-border)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--surface-border)] text-left text-caption">
                  <th className="px-4 py-2 font-normal">责任人</th>
                  <th className="px-4 py-2 font-normal">承诺数</th>
                  <th className="px-4 py-2 font-normal">逾期</th>
                  <th className="px-4 py-2 font-normal">兑现率</th>
                </tr>
              </thead>
              <tbody>
                {teamByOwner.map((r) => (
                  <tr key={r.owner} className="border-b border-[var(--surface-border)] last:border-0">
                    <td className="px-4 py-2 font-medium">{r.owner}</td>
                    <td className="px-4 py-2 tabular-nums">{r.total}</td>
                    <td className="px-4 py-2 tabular-nums" style={{ color: r.overdue > 0 ? "var(--signal-red-text)" : "var(--color-text-muted)" }}>{r.overdue}</td>
                    <td className="px-4 py-2 tabular-nums" style={{ color: r.rate >= 70 ? "var(--signal-green-text)" : r.rate >= 50 ? "var(--signal-yellow-text)" : "var(--signal-red-text)" }}>{r.rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3 text-caption">
        <Link href="/execution" className="text-[var(--color-accent)] hover:underline">执行全览 →</Link>
        <Link href="/decode" className="text-[var(--color-text-muted)] hover:underline">战略解码 (OKR/KR) →</Link>
      </div>
    </section>
  );
}
