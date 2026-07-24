import { redirect } from "next/navigation";

/** 兼容链：彩排已并入 /council 战略会 */
export default async function RehearsalRedirect({
  searchParams,
}: {
  searchParams: Promise<{ orgUnitId?: string; snapshotId?: string; setup?: string }>;
}) {
  const params = await searchParams;
  const sp = new URLSearchParams({ tab: "rehearsal" });
  if (params.orgUnitId) sp.set("orgUnitId", params.orgUnitId);
  if (params.snapshotId) sp.set("snapshotId", params.snapshotId);
  if (params.setup) sp.set("setup", params.setup);
  redirect(`/council?${sp.toString()}`);
}
