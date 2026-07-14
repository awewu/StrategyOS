import { CommitmentCockpit } from "@/components/cockpit/CommitmentCockpit";
import { PageHeader } from "@/components/ui/PageHeader";
import { getEffectiveRole, getEffectiveSession, requireRouteAccess } from "@/lib/auth/guard";
import { assertSliceAccess, getOrgScope } from "@/lib/auth/scope";
import { getSliceByIdGlobal } from "@/lib/monitor/org-slices";
import { filterBySlice } from "@/lib/monitor/org-slices";
import { getCommitmentRecords } from "@/lib/data/strategy-data";
import type { CommitmentRecord } from "@/lib/execution/tension-analysis";

const COMMITMENT_SLICE_GETTERS = [
  (c: CommitmentRecord) => c.department,
  (c: CommitmentRecord) => c.owner,
  (c: CommitmentRecord) => c.content,
  (c: CommitmentRecord) => c.linkedProjectCode,
];

export default async function CockpitPage({
  searchParams,
}: {
  searchParams: Promise<{ unit?: string }>;
}) {
  await requireRouteAccess("/cockpit");
  const role = await getEffectiveRole();
  const session = await getEffectiveSession();
  const orgScope = getOrgScope(role, session);
  const { unit } = await searchParams;

  const allowedUnit = assertSliceAccess(role, unit, session);
  let resolved = getSliceByIdGlobal(allowedUnit ?? undefined);
  if (!resolved && orgScope && orgScope.length > 0) {
    resolved = getSliceByIdGlobal(orgScope[0]);
  }

  const all = await getCommitmentRecords();
  const commitments = resolved
    ? filterBySlice(all, resolved.slice, COMMITMENT_SLICE_GETTERS)
    : all;

  const sliceLabel = resolved?.slice.label ?? "集团全览";

  return (
    <div className="stratos-page">
      <PageHeader
        eyebrow="坚守驾驶舱 · 管理层"
        title="坚守驾驶舱"
        subtitle={`承诺兑现 · 逾期示警 · ${sliceLabel}`}
      />
      <CommitmentCockpit
        commitments={commitments}
        sliceLabel={resolved?.slice.label}
        myName={session?.name}
      />
    </div>
  );
}
