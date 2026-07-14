import Link from "next/link";
import { CommitmentSummaryCard } from "@/components/execution/CommitmentSummaryCard";
import { ReportSignalsPanel } from "@/components/execution/ReportSignalsPanel";
import { SliceExecutionExpand } from "@/components/monitor/SliceExecutionExpand";
import { TrafficLightDot } from "@/components/ui/TrafficLight";
import { SectionCard } from "@/components/ui/KpiTile";
import type { getExecutionBundle } from "@/lib/data/strategy-data";
import { executionHrefForSlice } from "@/lib/monitor/filter-exec";
import { getSliceKpis } from "@/lib/monitor/slice-kpis";
import { filterBySlice, type OrgSlice } from "@/lib/monitor/org-slices";

type Exec = Awaited<ReturnType<typeof getExecutionBundle>>;

export async function OrgSlicePanel({
  slice,
  exec,
  kind,
}: {
  slice: OrgSlice;
  exec: Exec;
  kind: "function" | "bu";
}) {
  const commitments = filterBySlice(exec.commitments, slice, [
    (c) => c.department,
    (c) => c.owner,
    (c) => c.content,
    (c) => c.linkedProjectCode,
  ]);

  const tensions = filterBySlice(exec.tensions, slice, [
    (t) => t.projectName,
    (t) => t.projectCode,
    (t) => t.signal,
  ]).slice(0, 3);

  const reportSignals = filterBySlice(exec.reportSignals, slice, [
    (s) => s.orgUnitName,
    (s) => s.reportTitle,
    (s) => s.label,
  ]);

  const { kpis, source: kpiSource } = await getSliceKpis(slice, exec.leadingKrs);
  const fpaHref = slice.id === "org-exec-finance" ? "/finance" : "/finance?tab=management";

  return (
    <div className="space-y-6">
      <SectionCard
        title={`${slice.label} · 数据`}
        dense
        action={
          <div className="flex items-center gap-3">
            <span className="text-caption text-[var(--color-text-muted)]">
              KPI 源 {kpiSource === "database" ? "DB" : "Demo"}
            </span>
            <Link href={fpaHref} className="text-caption text-[var(--color-accent)] hover:underline">
              FPA 深潜 →
            </Link>
          </div>
        }
      >
        <table className="w-full text-left text-sm">
          <thead className="text-[var(--color-text-muted)]">
            <tr>
              <th className="pb-2">KPI</th>
              <th className="pb-2">目标</th>
              <th className="pb-2">实际</th>
              <th className="pb-2">灯</th>
            </tr>
          </thead>
          <tbody>
            {kpis.map((k) => (
              <tr key={k.name} className="border-t border-[var(--surface-border)]">
                <td className="py-2">{k.name}</td>
                <td className="py-2 text-[var(--color-text-muted)]">{k.target}</td>
                <td className="py-2">{k.value}</td>
                <td className="py-2">
                  <TrafficLightDot signal={k.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-subsection font-semibold text-[var(--color-text-primary)]">
            {slice.label} · 执行分析
          </h2>
          <Link
            href={executionHrefForSlice(slice.id)}
            className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:underline"
          >
            执行 · 全览（专家页）→
          </Link>
        </div>

        {tensions.length > 0 ? (
          <ul className="grid gap-3 md:grid-cols-3">
            {tensions.map((t) => (
              <li
                key={t.id}
                className="rounded-lg border border-[var(--surface-border)] bg-[var(--surface-panel)] p-4"
              >
                <p className="text-caption">{t.projectCode}</p>
                <p className="mt-1 text-sm font-medium">{t.projectName}</p>
                <p className="mt-2 line-clamp-2 text-xs text-[var(--color-text-secondary)]">{t.signal}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[var(--color-text-muted)]">本单元暂无高优先级张力 · 可在执行全览中查看集团视图</p>
        )}

        <ReportSignalsPanel signals={reportSignals} />

        <CommitmentSummaryCard records={commitments} unit={slice.id} />
      </section>

      <SliceExecutionExpand slice={slice} data={exec} />

      <p className="text-caption">
        {kind === "bu" ? "事业部" : "职能体系"} · N-1 监测 · 数据源 {exec.source === "database" ? "DB" : "Demo"}
      </p>
    </div>
  );
}
