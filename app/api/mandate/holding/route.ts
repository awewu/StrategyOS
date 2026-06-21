import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const VALID_STATUS = ["CLAIMED", "DELIVERED", "HANDED_OVER", "MISSED"];

export async function POST(req: Request) {
  try {
    const b = await req.json();
    const { id, mandateId, meetingId, holderName, holderRole, status, commitment, deadline, deliveryNote, handoverNote, handoverToName, invited, attended } = b;
    if (!id) {
      if (!mandateId || !meetingId) return NextResponse.json({ error: "需指定职责与会议" }, { status: 400 });
      if (!holderName?.trim() || !holderRole?.trim()) return NextResponse.json({ error: "责任人与角色必填" }, { status: 400 });
    }
    if (status && !VALID_STATUS.includes(status)) return NextResponse.json({ error: "状态无效" }, { status: 400 });

    const data: Record<string, unknown> = {
      holderName: holderName?.trim(),
      holderRole: holderRole?.trim(),
      status: status ?? "CLAIMED",
      commitment: commitment?.trim() || null,
      deadline: deadline ? new Date(deadline) : null,
      deliveryNote: deliveryNote?.trim() || null,
      handoverNote: handoverNote?.trim() || null,
      handoverToName: handoverToName?.trim() || null,
    };
    if (invited) data.invitedAt = new Date();
    if (attended) data.attendedAt = new Date();

    let holding;
    if (id) {
      holding = await prisma.mandateHolding.update({ where: { id }, data });
    } else {
      holding = await prisma.mandateHolding.create({
        data: { ...data, mandateId, meetingId, holderName: holderName.trim(), holderRole: holderRole.trim(), invitedAt: new Date() } as never,
      });
    }
    return NextResponse.json({ ok: true, holding });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    await prisma.mandateHolding.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
