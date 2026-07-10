import { prisma } from "@/lib/db";
import type { Holding, Mandate, MandateBundle, Meeting } from "./types";

function iso(d: Date | null): string | null {
  return d ? d.toISOString().slice(0, 10) : null;
}

export async function getMandateBundle(): Promise<MandateBundle> {
  const [mandateRows, meetingRows, planRows, userRows] = await Promise.all([
    prisma.strategyMandate.findMany({
      orderBy: [{ closed: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
      include: {
        holdings: {
          include: { meeting: true },
          orderBy: { createdAt: "asc" },
        },
      },
    }),
    prisma.strategyMeeting.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { holdings: true } },
        plan: { include: { orgUnit: { select: { name: true } } } },
        participants: { orderBy: { createdAt: "asc" } },
        todos: { orderBy: [{ completed: "asc" }, { dueDate: "asc" }, { createdAt: "asc" }] },
      },
    }),
    prisma.strategicPlan.findMany({
      orderBy: [{ horizonStart: "desc" }, { updatedAt: "desc" }],
      include: { orgUnit: { select: { name: true } } },
    }),
    prisma.user.findMany({
      orderBy: [{ name: "asc" }, { createdAt: "asc" }],
      include: { orgUnit: { select: { name: true } } },
    }),
  ]);

  const mandates: Mandate[] = mandateRows.map((m) => ({
    id: m.id, code: m.code, title: m.title, theme: m.theme,
    description: m.description, status: m.status as Mandate["status"],
    closed: m.closed, linkedProjectCode: m.linkedProjectCode,
    linkedAssumptionCode: m.linkedAssumptionCode,
    holdings: m.holdings.map((h): Holding => ({
      id: h.id, mandateId: h.mandateId, meetingId: h.meetingId,
      meetingTitle: h.meeting.title,
      meetingType: h.meeting.meetingType as Holding["meetingType"],
      meetingPeriod: h.meeting.period,
      meetingDate: iso(h.meeting.meetingDate),
      holderName: h.holderName, holderRole: h.holderRole,
      invitedAt: iso(h.invitedAt), attendedAt: iso(h.attendedAt),
      status: h.status as Holding["status"],
      commitment: h.commitment, deadline: iso(h.deadline),
      deliveryNote: h.deliveryNote, handoverNote: h.handoverNote,
      handoverToName: h.handoverToName,
    })),
  }));

  const meetings: Meeting[] = meetingRows.map((mt) => ({
    id: mt.id, planId: mt.planId,
    planLabel: mt.plan ? `${mt.plan.orgUnit.name} · ${mt.plan.horizonStart}-${mt.plan.horizonEnd}` : null,
    title: mt.title, meetingType: mt.meetingType as Meeting["meetingType"],
    period: mt.period, meetingDate: iso(mt.meetingDate),
    status: mt.status as Meeting["status"], agenda: mt.agenda, notes: mt.notes,
    holdingCount: mt._count.holdings,
    participantUserIds: mt.participants.flatMap((p) => p.userId ? [p.userId] : []),
    participants: mt.participants.map((p) => ({
      id: p.id, userId: p.userId, name: p.participantName, role: p.participantRole,
    })),
    todos: mt.todos.map((todo) => ({
      id: todo.id, title: todo.title, ownerUserId: todo.ownerUserId,
      ownerName: todo.ownerName, dueDate: iso(todo.dueDate), completed: todo.completed,
    })),
  }));

  const plans = planRows.map((plan) => ({
    id: plan.id,
    label: `${plan.orgUnit.name} · ${plan.horizonStart}-${plan.horizonEnd}`,
    status: plan.status,
  }));
  const users = userRows.map((user) => ({
    id: user.id,
    name: user.name,
    role: String(user.role),
    orgUnitName: user.orgUnit?.name ?? null,
  }));

  return { mandates, meetings, plans, users };
}
