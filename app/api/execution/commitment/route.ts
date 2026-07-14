import { NextResponse } from "next/server";
import { requireApiMinLevel } from "@/lib/auth/api-guard";
import { logUsageEvent } from "@/lib/audit/log-event";
import { prisma } from "@/lib/db";
import type { CommitmentStatus } from "@prisma/client";

export const runtime = "nodejs";

const VALID_STATUS = ["pending", "in_progress", "completed", "overdue"];

export async function GET() {
  const denied = await requireApiMinLevel(1);
  if (denied) return denied;
  const rows = await prisma.commitment.findMany({ orderBy: { deadline: "asc" } });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;
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

/** 轻操作：就地改状态（标记完成）或催办（仅记审计，不改数据） */
export async function PATCH(req: Request) {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;
  try {
    const b = (await req.json()) as { id?: string; status?: string; nudge?: boolean };
    if (!b.id) return NextResponse.json({ error: "id required" }, { status: 400 });

    if (b.nudge) {
      const row = await prisma.commitment.findUnique({ where: { id: b.id } });
      if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
      await logUsageEvent({
        action: "commitment_nudge",
        resource: `/api/execution/commitment/${b.id}`,
        metadata: { owner: row.ownerName, content: row.content, deadline: row.deadline },
        request: req,
      });
      return NextResponse.json({ ok: true, nudged: true });
    }

    if (!b.status || !VALID_STATUS.includes(b.status)) {
      return NextResponse.json({ error: "status invalid" }, { status: 400 });
    }
    const persistStatus = (b.status === "overdue" ? "in_progress" : b.status) as CommitmentStatus;
    const row = await prisma.commitment.update({
      where: { id: b.id },
      data: { status: persistStatus },
    });
    await logUsageEvent({
      action: "commitment_update",
      resource: `/api/execution/commitment/${b.id}`,
      metadata: { status: persistStatus },
      request: req,
    });
    return NextResponse.json({ ok: true, commitment: row });
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
    await prisma.commitment.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
