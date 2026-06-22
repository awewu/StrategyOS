"use client";

import Link from "next/link";
import { ExecutionDashboard } from "@/components/execution/ExecutionDashboard";
import { executionHrefForSlice, filterExecBundle, type ExecBundle } from "@/lib/monitor/filter-exec";
import type { OrgSlice } from "@/lib/monitor/org-slices";

export function SliceExecutionExpand({
  slice,
  data,
}: {
  slice: OrgSlice;
  data: ExecBundle;
}) {
  const filtered = filterExecBundle(data, slice);
  const expertHref = executionHrefForSlice(slice.id);

  return (
    <details className="group rounded-xl border border-[var(--surface-border)] bg-[var(--surface-panel)]">
      <summary className="cursor-pointer list-none px-5 py-4 text-sm font-medium text-[var(--color-text-secondary)] transition-colors group-open:text-[var(--color-text-primary)] [&::-webkit-details-marker]:hidden">
        <span className="flex flex-wrap items-center justify-between gap-2">
          <span>展开执行监测 · {slice.label} 专家视图</span>
          <Link
            href={expertHref}
            onClick={(e) => e.stopPropagation()}
            className="text-xs font-normal text-[var(--color-accent)] hover:underline"
          >
            独立页打开 →
          </Link>
        </span>
      </summary>
      <div className="border-t border-[var(--surface-border)] px-5 pb-6 pt-4">
        <ExecutionDashboard data={filtered} sliceLabel={slice.label} compact />
      </div>
    </details>
  );
}
