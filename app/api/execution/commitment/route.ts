import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const VALID_STATUS = ["pending", "in_progress", "completed", "overdue"];

export async function GET() {
  const rows = await prisma.commitment.findMany({ orderBy: { deadline: "asc" } });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  try {
    const b = await req.json();
    if (!b.content || !b.ownerName || !b.deadline) {
      return NextResponse.json({ error: "content/ownerName/deadline 必填" }, { status: 400 });
    }
    const status = VALID_STATUS.includes(b.status) ? b.status : "pending";
    // overdue is derived at read time; persist the closest base status
    const persistStatus = status === "overdue" ? "in_progress" : status;
    const data = {
      ownerName: b.ownerName,
      promiseTo: b.promiseTo || b.department || b.ownerName,
      content: b.content,
      deadline: new Date(b.deadline),
      status: persistStatus,
      linkedProjectCode: b.linkedProjectCode || null,
      linkedAssumptionCode: b.linkedAssumptionCode || null,
    };
    const row = b.id
      ? await prisma.commitment.update({ where: { id: b.id }, data })
      : await prisma.commitment.create({ data });
    return NextResponse.json({ ok: true, commitment: row });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    await prisma.commitment.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
