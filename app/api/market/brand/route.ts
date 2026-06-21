import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

/** 列出竞品品牌 */
export async function GET() {
  const brands = await prisma.competitorBrand.findMany({
    orderBy: [{ tier: "asc" }, { sortOrder: "asc" }],
    include: { _count: { select: { products: true, cells: true, researchItems: true } } },
  });
  return NextResponse.json(brands);
}

/** 新增/更新竞品品牌（可增删核心能力） */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, name, nameEn, competitorType, tier, threatLevel, hq, positioning, active, sortOrder } = body;
    if (!name) return NextResponse.json({ error: "name 必填" }, { status: 400 });
    const data = {
      name, nameEn: nameEn ?? null, competitorType: competitorType ?? "existing",
      tier: tier ?? "watch", threatLevel: threatLevel ?? "medium",
      hq: hq ?? null, positioning: positioning ?? null,
      active: active ?? true, sortOrder: sortOrder ?? 999,
    };
    const brand = id
      ? await prisma.competitorBrand.update({ where: { id }, data })
      : await prisma.competitorBrand.create({ data });
    return NextResponse.json({ success: true, brand });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}

/** 删除竞品品牌（级联删除其产品/单元/研究） */
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.competitorBrand.delete({ where: { id } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
