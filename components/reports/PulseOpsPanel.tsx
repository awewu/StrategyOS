import { getPulseOpsStats, reportTypeLabel } from "@/lib/reports/pulse-ops-stats";

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export async function PulseOpsPanel() {
  const stats = await getPulseOpsStats();
  if (!stats) return null;

  return (
    <section className="stratos-card stratos-card--padded">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-title text-[var(--color-text-primary)]">脉搏与导入 · Ops</h2>
          <p className="text-caption mt-0.5">查重拦截统计与最近档案入库摘要</p>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px]">
          {stats.byType.slice(0, 5).map((row) => (
            <span
              key={row.reportType}
              className="rounded-full border border-[var(--surface-border)] bg-[var(--surface-raised)] px-2.5 py-1 text-[var(--color-text-secondary)]"
            >
              {reportTypeLabel(row.reportType)} · {row.count}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-[var(--surface-border)] bg-[var(--surface-raised)] px-4 py-3">
          <p className="text-[11px] text-[var(--color-text-muted)]">月度脉搏总数</p>
          <p className="mt-1 text-xl font-semibold text-[var(--color-text-primary)]">{stats.pulseTotal}</p>
        </div>
        <div className="rounded-lg border border-[var(--surface-border)] bg-[var(--surface-raised)] px-4 py-3">
          <p className="text-[11px] text-[var(--color-text-muted)]">近 30 天提交</p>
          <p className="mt-1 text-xl font-semibold text-[var(--color-text-primary)]">{stats.pulseLast30Days}</p>
        </div>
        <div className="rounded-lg border border-[var(--surface-border)] bg-[var(--surface-raised)] px-4 py-3">
          <p className="text-[11px] text-[var(--color-text-muted)]">跨月相同一句话</p>
          <p
            className={`mt-1 text-xl font-semibold ${
              stats.copyPasteSuspects > 0 ? "text-[var(--signal-yellow)]" : "text-[var(--color-text-primary)]"
            }`}
          >
            {stats.copyPasteSuspects}
          </p>
        </div>
      </div>

      {stats.duplicateBlocks.length > 0 && (
        <div className="mt-5">
          <h3 className="text-xs font-semibold text-[var(--signal-yellow)]">同组织同月多条脉搏</h3>
          <ul className="mt-2 space-y-2">
            {stats.duplicateBlocks.map((block) => (
              <li
                key={`${block.orgUnitId}-${block.period}`}
                className="rounded-lg border border-[var(--signal-yellow)]/30 bg-[var(--signal-yellow)]/10 px-3 py-2 text-xs text-[var(--color-text-secondary)]"
              >
                <span className="font-medium text-[var(--color-text-primary)]">{block.orgUnitName}</span>
                {" · "}
                {block.period}
                {" · "}
                {block.count} 条
                <span className="ml-2 font-mono text-[11px] text-[var(--color-text-muted)]">
                  {block.reportIds.slice(0, 3).join(", ")}
                  {block.reportIds.length > 3 ? "…" : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {stats.recentImports.length > 0 && (
        <div className="mt-5">
          <h3 className="text-xs font-semibold text-[var(--color-text-primary)]">最近入库</h3>
          <ul className="mt-2 divide-y divide-[var(--surface-border)] rounded-lg border border-[var(--surface-border)]">
            {stats.recentImports.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs">
                <div className="min-w-0">
                  <span className="font-medium text-[var(--color-text-primary)]">{row.title}</span>
                  <span className="ml-2 text-[var(--color-text-muted)]">
                    {reportTypeLabel(row.reportType)} · {row.period}
                    {row.orgUnitName ? ` · ${row.orgUnitName}` : ""}
                  </span>
                </div>
                <time className="shrink-0 text-[var(--color-text-muted)]">{formatWhen(row.uploadedAt)}</time>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
