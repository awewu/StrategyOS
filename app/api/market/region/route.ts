import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const regions = await prisma.salesRegion.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
  return NextResponse.json(regions);
}

export async function POST(req: Request) {
  try {
    const { id, name, code, parentId, active, sortOrder } = await req.json();
    if (!name || !code) return NextResponse.json({ error: "name/code 必填" }, { status: 400 });
    const data = { name, code, parentId: parentId ?? null, active: active ?? true, sortOrder: sortOrder ?? 999 };
    const region = id
      ? await prisma.salesRegion.update({ where: { id }, data })
      : await prisma.salesRegion.create({ data });
    return NextResponse.json({ ok: true, region });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    await prisma.salesRegion.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
