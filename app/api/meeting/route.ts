import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getActivePeriod } from "@/lib/data/active-period";

export const runtime = "nodejs";

const VALID_TYPE = ["MID_YEAR", "YEAR_END", "TOPIC", "REVIEW"];
const VALID_STATUS = ["INVITING", "IN_PROGRESS", "ARCHIVED"];

export async function POST(req: Request) {
  try {
    const { id, title, meetingType, period, meetingDate, status, agenda, notes } = await req.json();
    if (!title?.trim()) return NextResponse.json({ error: "标题必填" }, { status: 400 });
    if (meetingType && !VALID_TYPE.includes(meetingType)) return NextResponse.json({ error: "会议类型无效" }, { status: 400 });
    if (status && !VALID_STATUS.includes(status)) return NextResponse.json({ error: "状态无效" }, { status: 400 });

    const data = {
      title: title.trim(),
      meetingType: meetingType ?? "TOPIC",
      period: period?.trim() || (await getActivePeriod()),
      meetingDate: meetingDate ? new Date(meetingDate) : null,
      status: status ?? "INVITING",
      agenda: agenda?.trim() || null,
      notes: notes?.trim() || null,
    };
    const meeting = id
      ? await prisma.strategyMeeting.update({ where: { id }, data })
      : await prisma.strategyMeeting.create({ data });
    return NextResponse.json({ ok: true, meeting });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    const holdingCount = await prisma.mandateHolding.count({ where: { meetingId: id } });
    if (holdingCount > 0) {
      return NextResponse.json({ error: `该会议已存档 ${holdingCount} 条职责认领，无法删除` }, { status: 409 });
    }
    await prisma.strategyMeeting.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
