import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiMinLevel } from "@/lib/auth/api-guard";

export const runtime = "nodejs";

const MOMENTUM = ["up", "flat", "down"];

export async function GET() {
  const rows = await prisma.competitorTrack.findMany({ orderBy: { competitor: "asc" } });
  return NextResponse.json(rows);
}

/** 整表替换：竞品追踪矩阵 */
export async function PUT(req: Request) {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;
  try {
    const { rows } = await req.json();
    if (!Array.isArray(rows)) return NextResponse.json({ error: "rows 必须是数组" }, { status: 400 });
    const seen = new Set<string>();
    for (const r of rows) {
      if (!r.competitor?.trim()) return NextResponse.json({ error: "competitor 必填" }, { status: 400 });
      if (seen.has(r.competitor.trim())) {
        return NextResponse.json({ error: `竞品 ${r.competitor} 重复` }, { status: 400 });
      }
      seen.add(r.competitor.trim());
      if (r.momentum && !MOMENTUM.includes(r.momentum)) {
        return NextResponse.json({ error: "momentum 需为 up/flat/down" }, { status: 400 });
      }
    }
    await prisma.$transaction([
      prisma.competitorTrack.deleteMany({}),
      prisma.competitorTrack.createMany({
        data: rows.map((r: Record<string, string>) => ({
          competitor: r.competitor.trim().slice(0, 50),
          product: r.product?.trim() || null,
          gtm: r.gtm?.trim() || null,
          brand: r.brand?.trim() || null,
          strategy: r.strategy?.trim() || null,
          momentum: r.momentum ?? "flat",
          momentumNote: r.momentumNote?.trim() || null,
        })),
      }),
    ]);
    const saved = await prisma.competitorTrack.findMany({ orderBy: { competitor: "asc" } });
    return NextResponse.json({ ok: true, rows: saved });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "保存失败" }, { status: 500 });
  }
}
