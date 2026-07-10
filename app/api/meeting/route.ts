import { NextResponse } from "next/server";
import type { MeetingStatus, MeetingType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getActivePeriod } from "@/lib/data/active-period";

export const runtime = "nodejs";

const VALID_TYPE = ["MID_YEAR", "YEAR_END", "TOPIC", "REVIEW"];
const VALID_STATUS = ["INVITING", "IN_PROGRESS", "ARCHIVED"];

export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      id?: string;
      planId?: string;
      title?: string;
      meetingType?: string;
      period?: string;
      meetingDate?: string;
      status?: string;
      agenda?: string;
      notes?: string;
      participantUserIds?: string[];
      todos?: Array<{
        id?: string;
        title?: string;
        ownerUserId?: string | null;
        dueDate?: string | null;
        completed?: boolean;
      }>;
    };
    const { id, planId, title, meetingType, period, meetingDate, status, agenda, notes } = body;
    if (!title?.trim()) return NextResponse.json({ error: "标题必填" }, { status: 400 });
    if (!planId) return NextResponse.json({ error: "请选择关联战略" }, { status: 400 });
    if (meetingType && !VALID_TYPE.includes(meetingType)) return NextResponse.json({ error: "会议类型无效" }, { status: 400 });
    if (status && !VALID_STATUS.includes(status)) return NextResponse.json({ error: "状态无效" }, { status: 400 });

    const participantUserIds = Array.from(new Set(
      (body.participantUserIds ?? []).filter((userId): userId is string => typeof userId === "string" && userId.length > 0),
    ));
    if (participantUserIds.length === 0) {
      return NextResponse.json({ error: "请至少添加一名参会人员" }, { status: 400 });
    }
    const todoOwnerUserIds = (body.todos ?? []).flatMap((todo) =>
      typeof todo.ownerUserId === "string" && todo.ownerUserId.length > 0 ? [todo.ownerUserId] : [],
    );
    const referencedUserIds = Array.from(new Set([...participantUserIds, ...todoOwnerUserIds]));

    const [plan, users] = await Promise.all([
      prisma.strategicPlan.findUnique({ where: { id: planId }, select: { id: true } }),
      prisma.user.findMany({
        where: { id: { in: referencedUserIds } },
        select: { id: true, name: true, role: true },
      }),
    ]);
    if (!plan) return NextResponse.json({ error: "关联战略不存在" }, { status: 400 });
    const participantUsers = users.filter((user) => participantUserIds.includes(user.id));
    if (participantUsers.length !== participantUserIds.length) {
      return NextResponse.json({ error: "部分参会人员不存在，请刷新后重试" }, { status: 400 });
    }

    const data = {
      planId,
      title: title.trim(),
      meetingType: (meetingType ?? "TOPIC") as MeetingType,
      period: period?.trim() || (await getActivePeriod()),
      meetingDate: meetingDate ? new Date(meetingDate) : null,
      status: (status ?? "INVITING") as MeetingStatus,
      agenda: agenda?.trim() || null,
      notes: notes?.trim() || null,
    };

    const meeting = await prisma.$transaction(async (tx) => {
      const saved = id
        ? await tx.strategyMeeting.update({ where: { id }, data })
        : await tx.strategyMeeting.create({ data });

      await tx.meetingParticipant.deleteMany({ where: { meetingId: saved.id } });
      await tx.meetingParticipant.createMany({
        data: participantUsers.map((user) => ({
          meetingId: saved.id,
          userId: user.id,
          participantName: user.name,
          participantRole: String(user.role),
        })),
      });

      if (id) {
        const todos = (body.todos ?? [])
          .map((todo) => ({ ...todo, title: todo.title?.trim() ?? "" }))
          .filter((todo) => todo.title.length > 0);
        const retainedIds = todos.flatMap((todo) => todo.id ? [todo.id] : []);
        await tx.meetingTodo.deleteMany({
          where: { meetingId: saved.id, ...(retainedIds.length > 0 ? { id: { notIn: retainedIds } } : {}) },
        });

        for (const todo of todos) {
          const owner = todo.ownerUserId
            ? users.find((user) => user.id === todo.ownerUserId) ?? null
            : null;
          const todoData = {
            title: todo.title,
            ownerUserId: owner?.id ?? null,
            ownerName: owner?.name ?? null,
            dueDate: todo.dueDate ? new Date(todo.dueDate) : null,
            completed: Boolean(todo.completed),
          };
          if (todo.id) {
            await tx.meetingTodo.updateMany({
              where: { id: todo.id, meetingId: saved.id },
              data: todoData,
            });
          } else {
            await tx.meetingTodo.create({ data: { meetingId: saved.id, ...todoData } });
          }
        }
      }

      return tx.strategyMeeting.findUniqueOrThrow({
        where: { id: saved.id },
        include: { participants: true, todos: true, plan: true },
      });
    });
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
