import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { loadCellDetail } from "@/lib/market-intel/workbench-data";

export const runtime = "nodejs";

/** 获取单个竞争单元详情（产品对比+研究+赢丢单+趋势） */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const productLineId = searchParams.get("productLineId");
  const regionId = searchParams.get("regionId");
  const competitorId = searchParams.get("competitorId");
  if (!productLineId || !regionId || !competitorId) {
    return NextResponse.json({ error: "缺少 productLineId/regionId/competitorId" }, { status: 400 });
  }
  const detail = await loadCellDetail(productLineId, regionId, competitorId);
  return NextResponse.json(detail);
}

/** 创建或更新竞争单元（人工修订主轴：标记 editedManually） */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { productLineId, regionId, competitorId, threatLevel, ourPosition, marketShareEst, priceIndexUs, dealerCountComp, dealerCountUs, summary } = body;
    if (!productLineId || !regionId || !competitorId) {
      return NextResponse.json({ error: "缺少三维坐标" }, { status: 400 });
    }
    const cell = await prisma.competitiveCell.upsert({
      where: { productLineId_regionId_competitorId: { productLineId, regionId, competitorId } },
      update: {
        threatLevel, ourPosition,
        marketShareEst: marketShareEst ?? null, priceIndexUs: priceIndexUs ?? null,
        dealerCountComp: dealerCountComp ?? null, dealerCountUs: dealerCountUs ?? null,
        summary: summary ?? null, editedManually: true, lastReviewedAt: new Date(),
      },
      create: {
        productLineId, regionId, competitorId,
        threatLevel: threatLevel ?? "medium", ourPosition: ourPosition ?? "parity",
        marketShareEst: marketShareEst ?? null, priceIndexUs: priceIndexUs ?? null,
        dealerCountComp: dealerCountComp ?? null, dealerCountUs: dealerCountUs ?? null,
        summary: summary ?? null, editedManually: true, lastReviewedAt: new Date(),
      },
    });
    return NextResponse.json({ success: true, cellId: cell.id });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}

/** 删除竞争单元 */
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.competitiveCell.delete({ where: { id } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
