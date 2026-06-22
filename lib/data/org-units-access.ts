/**
 * Org unit reads — DB when available, demo tree fallback on connection/query failure.
 */
import type { OrgUnit } from "@prisma/client";
import { prisma, safeDbQuery } from "@/lib/db";

export type OrgUnitWithChildren = OrgUnit & { children: OrgUnit[] };

const DEMO_TS = new Date("2026-01-01T00:00:00.000Z");

function unit(
  id: string,
  name: string,
  level: OrgUnit["level"],
  sortOrder: number,
  parentId: string | null,
  nameEn?: string,
): OrgUnitWithChildren {
  return {
    id,
    name,
    nameEn: nameEn ?? null,
    level,
    sortOrder,
    parentId,
    createdAt: DEMO_TS,
    updatedAt: DEMO_TS,
    children: [],
  };
}

/** Mirrors prisma/seed-orgs.ts — enough for strategy input & reports UI. */
function demoOrgUnitsWithChildren(): OrgUnitWithChildren[] {
  const group = unit("org-group-rhautt", "瑞合瑞德集团", "GROUP", 1, null, "RHAUTT GROUP");
  const executives = [
    unit("org-exec-ac", "空调事业部", "EXECUTIVE", 10, group.id, "Air Conditioning BU"),
    unit("org-exec-hw", "热水事业部", "EXECUTIVE", 20, group.id, "Hot Water BU"),
    unit("org-exec-bd", "BD事业部", "EXECUTIVE", 25, group.id, "Business Development BU"),
    unit("org-exec-brand", "品牌事业部", "EXECUTIVE", 30, group.id, "Brand BU"),
    unit("org-exec-rd", "研发中心", "EXECUTIVE", 40, group.id, "R&D Center"),
    unit("org-exec-mfg", "制造事业部", "EXECUTIVE", 50, group.id, "Manufacturing BU"),
    unit("org-exec-cmo", "CMO", "EXECUTIVE", 60, group.id, "Chief Marketing Officer"),
    unit("org-exec-hr", "HR", "EXECUTIVE", 70, group.id, "Human Resources"),
    unit("org-exec-finance", "财务", "EXECUTIVE", 80, group.id, "Finance"),
  ];
  const operating = [
    unit("org-op-ac-commercial", "商用空调部", "OPERATING_UNIT", 11, "org-exec-ac"),
    unit("org-op-ac-residential", "家用空调部", "OPERATING_UNIT", 12, "org-exec-ac"),
    unit("org-op-hw-heatpump", "热泵产品部", "OPERATING_UNIT", 21, "org-exec-hw"),
    unit("org-op-hw-storage", "储水产品部", "OPERATING_UNIT", 22, "org-exec-hw"),
    unit("org-op-bd-strategic", "战略客户部", "OPERATING_UNIT", 26, "org-exec-bd"),
    unit("org-op-bd-channel", "渠道拓展部", "OPERATING_UNIT", 27, "org-exec-bd"),
    unit("org-op-rd-core", "核心技术部", "OPERATING_UNIT", 41, "org-exec-rd"),
    unit("org-op-rd-product", "产品开发部", "OPERATING_UNIT", 42, "org-exec-rd"),
    unit("org-op-mfg-supply", "供应链部", "OPERATING_UNIT", 51, "org-exec-mfg"),
    unit("org-op-mfg-quality", "质量管理部", "OPERATING_UNIT", 52, "org-exec-mfg"),
    unit("org-op-hr-talent", "人才发展部", "OPERATING_UNIT", 71, "org-exec-hr"),
    unit("org-op-finance-fpa", "FP&A", "OPERATING_UNIT", 81, "org-exec-finance"),
  ];

  const byParent = new Map<string, OrgUnit[]>();
  for (const op of operating) {
    if (!op.parentId) continue;
    const list = byParent.get(op.parentId) ?? [];
    list.push(op);
    byParent.set(op.parentId, list);
  }

  const withChildren = (u: OrgUnitWithChildren): OrgUnitWithChildren => ({
    ...u,
    children: byParent.get(u.id) ?? [],
  });

  return [withChildren(group), ...executives.map(withChildren), ...operating.map((o) => ({ ...o, children: [] }))];
}

export async function getOrgUnitsWithChildren(): Promise<OrgUnitWithChildren[]> {
  return safeDbQuery(
    () =>
      prisma.orgUnit.findMany({
        orderBy: [{ level: "asc" }, { sortOrder: "asc" }],
        include: { children: true },
      }),
    demoOrgUnitsWithChildren(),
  );
}

export async function getOrgUnitsFlat(): Promise<OrgUnit[]> {
  return safeDbQuery(
    () =>
      prisma.orgUnit.findMany({
        orderBy: [{ level: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
      }),
    demoOrgUnitsWithChildren(),
  );
}

export async function getOrgUnitsSummary(): Promise<
  Pick<OrgUnit, "id" | "name" | "level">[]
> {
  return safeDbQuery(
    () =>
      prisma.orgUnit.findMany({
        orderBy: [{ level: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
        select: { id: true, name: true, level: true },
      }),
    demoOrgUnitsWithChildren().map(({ id, name, level }) => ({ id, name, level })),
  );
}
