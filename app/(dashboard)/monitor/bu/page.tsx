import { redirect } from "next/navigation";
import { MonitorUnitTabs } from "@/components/monitor/MonitorUnitTabs";
import { OrgSlicePanel } from "@/components/monitor/OrgSlicePanel";
import { PageHeader } from "@/components/ui/PageHeader";
import { getEffectiveRole, getEffectiveSession } from "@/lib/auth/guard";
import { assertSliceAccess, getOrgScope } from "@/lib/auth/scope";
import { getExecutionBundle } from "@/lib/data/strategy-data";
import { BU_SLICES, getSliceById } from "@/lib/monitor/org-slices";

export default async function MonitorBuPage({
  searchParams,
}: {
  searchParams: Promise<{ unit?: string }>;
}) {
  const role = await getEffectiveRole();
  const session = await getEffectiveSession();
  const orgScope = getOrgScope(role, session);
  const { unit } = await searchParams;

  if (unit === "org-exec-brand") {
    redirect("/monitor/functions?unit=org-exec-brand");
  }

  const allowedUnit = assertSliceAccess(role, unit, session);
  if (unit && allowedUnit && unit !== allowedUnit) {
    redirect(`/monitor/bu?unit=${encodeURIComponent(allowedUnit)}`);
  }
  if (!unit && orgScope != null && orgScope.length > 0) {
    const defaultBu = orgScope.find((id) => BU_SLICES.some((s) => s.id === id));
    if (defaultBu) {
      redirect(`/monitor/bu?unit=${encodeURIComponent(defaultBu)}`);
    }
  }

  const slice = getSliceById(allowedUnit ?? unit, "bu");
  const exec = await getExecutionBundle();

  return (
    <div className="stratos-page">
      <PageHeader
        eyebrow="运行监测 · N-1"
        title="事业部"
        subtitle="运营 BU · 空调 / 热水 / BD / 制造 — N-1 轻量监测 · 专家视图见下方展开或执行全览"
      />
      <MonitorUnitTabs basePath="/monitor/bu" slices={BU_SLICES} activeId={slice.id} />
      <OrgSlicePanel slice={slice} exec={exec} kind="bu" />
    </div>
  );
}
