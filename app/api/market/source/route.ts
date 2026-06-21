import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const sources = await prisma.intelSource.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(sources);
}

export async function POST(req: Request) {
  try {
    const { id, competitor, kind, url, cadenceDays, active } = await req.json();
    if (!competitor || !kind) return NextResponse.json({ error: "competitor/kind 必填" }, { status: 400 });
    const data = { competitor, kind, url: url || null, cadenceDays: cadenceDays ?? 7, active: active ?? true };
    const source = id
      ? await prisma.intelSource.update({ where: { id }, data })
      : await prisma.intelSource.create({ data });
    return NextResponse.json({ ok: true, source });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    await prisma.intelSource.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
