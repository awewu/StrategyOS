import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

/** 列出竞品产品（含爆款信号），可按 brandId / productLineId 过滤 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const brandId = searchParams.get("brandId");
  const productLineId = searchParams.get("productLineId");
  const products = await prisma.competitorProduct.findMany({
    where: {
      isOurs: false,
      ...(brandId ? { brandId } : {}),
      ...(productLineId ? { productLineId } : {}),
    },
    orderBy: [{ hotRank: "asc" }, { sortOrder: "asc" }],
  });
  return NextResponse.json(products.map((p) => ({
    ...p,
    priceMin: p.priceMin ? Number(p.priceMin) : null,
    priceMax: p.priceMax ? Number(p.priceMax) : null,
    hotSignalAt: p.hotSignalAt ? p.hotSignalAt.toISOString().slice(0, 10) : null,
  })));
}

/** 新增/更新竞品产品 + 爆款信号 */
export async function POST(req: Request) {
  try {
    const b = await req.json();
    const { id, brandId, productLineId, name, modelCode, priceMin, priceMax, lifecycle,
      positioning, tracked, hotRank, hotSignalNote, hotSignalAt, salesVelocity, sortOrder } = b;
    if (!name) return NextResponse.json({ error: "name 必填" }, { status: 400 });
    const data = {
      brandId: brandId ?? null, productLineId: productLineId ?? null, isOurs: false,
      name, modelCode: modelCode ?? null,
      priceMin: priceMin != null ? priceMin : null, priceMax: priceMax != null ? priceMax : null,
      lifecycle: lifecycle ?? null, positioning: positioning ?? null,
      tracked: tracked ?? true,
      hotRank: hotRank != null ? hotRank : null,
      hotSignalNote: hotSignalNote ?? null,
      hotSignalAt: hotSignalAt ? new Date(hotSignalAt) : null,
      salesVelocity: salesVelocity ?? null,
      sortOrder: sortOrder ?? 999,
      editedManually: true, lastVerifiedAt: new Date(),
    };
    const product = id
      ? await prisma.competitorProduct.update({ where: { id }, data })
      : await prisma.competitorProduct.create({ data });
    return NextResponse.json({ ok: true, product });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    await prisma.competitorProduct.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
