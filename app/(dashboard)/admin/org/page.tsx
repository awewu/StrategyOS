import { prisma, safeDbQuery } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guard";
import { getOrgUnitsFlat } from "@/lib/data/org-units-access";
import { OrgAdminClient } from "@/components/admin/OrgAdminClient";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function OrgAdminPage() {
  await requireAdmin();
  const units = await getOrgUnitsFlat();
  const plans = await safeDbQuery(
    () =>
      prisma.strategicPlan.groupBy({
        by: ["orgUnitId"],
        _count: { id: true },
      }),
    [] as { orgUnitId: string; _count: { id: number } }[],
  );
  const planCounts: Record<string, number> = {};
  for (const p of plans) planCounts[p.orgUnitId] = p._count.id;

  const data = units.map((u) => ({
    id: u.id, name: u.name, nameEn: u.nameEn, level: u.level,
    parentId: u.parentId, sortOrder: u.sortOrder,
    planCount: planCounts[u.id] ?? 0,
  }));

  return (
    <div className="stratos-page">
      <PageHeader
        eyebrow="组织架构管理"
        title="事业部 · 体系 · 二级部门"
        subtitle="集团三层组织结构的增删改 · 战略录入入口的来源"
      />
      <OrgAdminClient units={data} />
    </div>
  );
}
