import { NextResponse } from "next/server";
import { requireApiMinLevel } from "@/lib/auth/api-guard";
import { asDbJson, prisma } from "@/lib/db";
import { getInnovationBundle } from "@/lib/innovation/data-access";

export const runtime = "nodejs";

export async function GET() {
  const denied = await requireApiMinLevel(1);
  if (denied) return denied;
  const bundle = await getInnovationBundle();
  return NextResponse.json(bundle);
}

export async function POST(req: Request) {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;
  try {
    const b = await req.json();
    if (!b.name) return NextResponse.json({ error: "name 必填" }, { status: 400 });
    const data = {
      name: String(b.name),
      lifecycleStage: String(b.lifecycleStage || "introduction"),
      dominantProblems: Array.isArray(b.dominantProblems) ? b.dominantProblems.map(String) : [],
      fAxisWeights: asDbJson(b.fAxisWeights ?? {}),
      gateThresholds: asDbJson(b.gateThresholds ?? {}),
      evidenceBar: Number.isFinite(Number(b.evidenceBar)) ? Number(b.evidenceBar) : 4,
    };
    const row = b.id
      ? await prisma.innovationProductLine.update({ where: { id: b.id }, data })
      : await prisma.innovationProductLine.create({ data });
    return NextResponse.json({ ok: true, line: row });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    await prisma.innovationProductLine.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
