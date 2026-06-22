import { NextResponse } from "next/server";
import { getOrgUnitsFlat } from "@/lib/data/org-units-access";
import { prisma, safeDbQuery } from "@/lib/db";

export const runtime = "nodejs";

const VALID_LEVELS = ["GROUP", "EXECUTIVE", "OPERATING_UNIT"] as const;
type OrgLevel = (typeof VALID_LEVELS)[number];

export async function GET() {
  const units = await getOrgUnitsFlat();
  return NextResponse.json(units);
}

export async function POST(req: Request) {
  try {
    const { id, name, nameEn, level, parentId, sortOrder } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "名称必填" }, { status: 400 });
    if (!VALID_LEVELS.includes(level)) return NextResponse.json({ error: "层级无效" }, { status: 400 });

    // 层级与父子关系校验
    if (level === "GROUP" && parentId) {
      return NextResponse.json({ error: "集团层不能有上级" }, { status: 400 });
    }
    if (level !== "GROUP" && !parentId) {
      return NextResponse.json({ error: "事业部/二级部门必须指定上级" }, { status: 400 });
    }
    if (parentId) {
      const parent = await prisma.orgUnit.findUnique({ where: { id: parentId } });
      if (!parent) return NextResponse.json({ error: "上级不存在" }, { status: 400 });
      if (level === "EXECUTIVE" && parent.level !== "GROUP") {
        return NextResponse.json({ error: "事业部/体系的上级必须是集团" }, { status: 400 });
      }
      if (level === "OPERATING_UNIT" && parent.level !== "EXECUTIVE") {
        return NextResponse.json({ error: "二级部门的上级必须是事业部/体系" }, { status: 400 });
      }
    }

    const data = {
      name: name.trim(),
      nameEn: nameEn?.trim() || null,
      level: level as OrgLevel,
      parentId: parentId ?? null,
      sortOrder: sortOrder ?? 999,
    };
    const unit = id
      ? await prisma.orgUnit.update({ where: { id }, data })
      : await prisma.orgUnit.create({ data });
    return NextResponse.json({ ok: true, unit });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    // 删除前校验：有子部门或已挂战略计划则阻断
    const [childCount, planCount] = await Promise.all([
      prisma.orgUnit.count({ where: { parentId: id } }),
      prisma.strategicPlan.count({ where: { orgUnitId: id } }),
    ]);
    if (childCount > 0) {
      return NextResponse.json({ error: `该单位下有 ${childCount} 个子部门，请先删除或转移子部门` }, { status: 409 });
    }
    if (planCount > 0) {
      return NextResponse.json({ error: `该单位已有 ${planCount} 份战略计划，无法删除（保留历史）` }, { status: 409 });
    }
    await prisma.orgUnit.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
