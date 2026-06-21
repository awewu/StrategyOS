import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

type Dimension = "product" | "gtm" | "brand" | "strategy";
type ResearchStatus = "todo" | "in_progress" | "current" | "stale" | "archived";

/** 新增/更新研究画布项（人工修订：origin=manual, editedManually=true） */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, brandId, cellId, dimension, subtopic, status, findings, evidence, ownerName, confidence, sourceReliability, infoCredibility, reviewEveryDays } = body;
    if (!brandId || !dimension || !subtopic) {
      return NextResponse.json({ error: "brandId/dimension/subtopic 必填" }, { status: 400 });
    }
    const data = {
      brandId, cellId: cellId ?? null, dimension: dimension as Dimension, subtopic,
      status: (status ?? "in_progress") as ResearchStatus,
      findings: findings ?? null, evidence: evidence ?? null, ownerName: ownerName ?? null,
      confidence: confidence ?? 50, sourceReliability: sourceReliability ?? null,
      infoCredibility: infoCredibility ?? null, reviewEveryDays: reviewEveryDays ?? 30,
      origin: "manual", editedManually: true, lastReviewedAt: new Date(),
    };
    const item = id
      ? await prisma.researchItem.update({ where: { id }, data })
      : await prisma.researchItem.create({ data });
    return NextResponse.json({ success: true, item });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.researchItem.delete({ where: { id } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
