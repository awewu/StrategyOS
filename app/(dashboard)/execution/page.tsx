import Link from "next/link";
import { ExecutionDashboard } from "@/components/execution/ExecutionDashboard";
import { ConceptGuide } from "@/components/ui/ConceptGuide";
import { PageHeader } from "@/components/ui/PageHeader";
import { getEffectiveRole, getEffectiveSession, requireRouteAccess } from "@/lib/auth/guard";
import { assertSliceAccess, getOrgScope, getProjectScope } from "@/lib/auth/scope";
import { getExecutionBundle } from "@/lib/data/strategy-data";
import { filterExecBundle, filterExecByProjectScope } from "@/lib/monitor/filter-exec";
import { getSliceByIdGlobal } from "@/lib/monitor/org-slices";

export default async function ExecutionPage({
  searchParams,
}: {
  searchParams: Promise<{ unit?: string }>;
}) {
  await requireRouteAccess("/execution");
  const role = await getEffectiveRole();
  const session = await getEffectiveSession();
  const projectScope = getProjectScope(role, session);
  const orgScope = getOrgScope(role, session);
  const { unit } = await searchParams;
  const data = await getExecutionBundle();

  const allowedUnit = assertSliceAccess(role, unit, session);
  let resolved = getSliceByIdGlobal(allowedUnit ?? undefined);
  if (!resolved && orgScope && orgScope.length > 0) {
    resolved = getSliceByIdGlobal(orgScope[0]);
  }
  let filtered = resolved ? filterExecBundle(data, resolved.slice) : data;
  filtered = filterExecByProjectScope(filtered, projectScope);

  return (
    <div className="stratos-page">
      <PageHeader
        eyebrow="集团全览"
        title={resolved ? `执行 · 全览 · ${resolved.slice.label}` : "执行 · 全览"}
        subtitle={
          resolved
            ? `专家页 · 已按 ${resolved.kind === "bu" ? "运营 BU" : "职能"} 过滤`
            : "张力 · 成熟度 · 承诺账本 · Vx / 4DX / TechSignal"
        }
        actions={
          <>
            {resolved ? (
              <Link
                href="/execution"
                className="rounded-xl border border-[var(--surface-border)] px-4 py-2.5 text-sm text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-accent)]/35 hover:text-[var(--color-accent)]"
              >
                清除过滤
              </Link>
            ) : null}
            <Link
              href="/monitor/bu"
              className="rounded-xl border border-[var(--surface-border)] px-4 py-2.5 text-sm text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-accent)]/35 hover:text-[var(--color-accent)]"
            >
              事业部监测 →
            </Link>
          </>
        }
      />
      <ExecutionDashboard data={filtered} sliceLabel={resolved?.slice.label} />
      <ConceptGuide ids={["fourDX", "cynefin"]} />
    </div>
  );
}
