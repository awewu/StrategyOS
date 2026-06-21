import { redirect } from "next/navigation";
import { MonitorUnitTabs } from "@/components/monitor/MonitorUnitTabs";
import { OrgSlicePanel } from "@/components/monitor/OrgSlicePanel";
import { PageHeader } from "@/components/ui/PageHeader";
import { getEffectiveRole, getEffectiveSession } from "@/lib/auth/guard";
import { assertSliceAccess, getOrgScope } from "@/lib/auth/scope";
import { getExecutionBundle } from "@/lib/data/strategy-data";
import { FUNCTION_SLICES, getSliceById } from "@/lib/monitor/org-slices";

export default async function MonitorFunctionsPage({
  searchParams,
}: {
  searchParams: Promise<{ unit?: string }>;
}) {
  const role = await getEffectiveRole();
  const session = await getEffectiveSession();
  const orgScope = getOrgScope(role, session);
  const { unit } = await searchParams;

  const allowedUnit = assertSliceAccess(role, unit, session);
  if (unit && allowedUnit && unit !== allowedUnit) {
    redirect(`/monitor/functions?unit=${encodeURIComponent(allowedUnit)}`);
  }
  if (!unit && orgScope != null && orgScope.length > 0) {
    const defaultFn = orgScope.find((id) => FUNCTION_SLICES.some((s) => s.id === id));
    if (defaultFn) {
      redirect(`/monitor/functions?unit=${encodeURIComponent(defaultFn)}`);
    }
  }

  const slice = getSliceById(allowedUnit ?? unit, "function");
  const exec = await getExecutionBundle();

  return (
    <div className="stratos-section-gap flex flex-col">
      <PageHeader
        eyebrow="运行监测 · N-1"
        title="职能体系"
        subtitle="职能体系 · 研发 / CMO / 品牌 / HR / 财务 — N-1 轻量监测 · 专家视图见下方展开"
      />
      <MonitorUnitTabs basePath="/monitor/functions" slices={FUNCTION_SLICES} activeId={slice.id} />
      <OrgSlicePanel slice={slice} exec={exec} kind="function" />
    </div>
  );
}
