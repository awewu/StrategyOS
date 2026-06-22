import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getActiveStrategicPlan } from "@/lib/data/strategic-plan-data";
import { syncPlanPremisesToAssumptions } from "@/lib/data/plan-assumption-sync";

export async function POST(req: Request) {
  const body = await req.json();
  const { id, planId, northStarId, ...data } = body as {
    id?: string;
    planId?: string;
    northStarId?: string;
    code: string;
    premise: string;
    category: string;
    confidence: number;
    fragility: number;
    validationNote?: string;
    failSignal?: string;
    signalSource?: string;
  };

  let resolvedPlanId = planId;
  if (!resolvedPlanId) {
    const { plan } = await getActiveStrategicPlan();
    resolvedPlanId = plan?.id;
  }

  const payload = {
    code: data.code,
    premise: data.premise,
    category: data.category,
    confidence: data.confidence,
    fragility: data.fragility,
    validationNote: data.validationNote,
    failSignal: data.failSignal,
    signalSource: data.signalSource,
    lastValidatedAt: new Date(),
  };

  if (resolvedPlanId) {
    if (id && id.includes("-")) {
      const row = await prisma.planPremise.update({
        where: { id },
        data: payload,
      });
      await syncPlanPremisesToAssumptions(resolvedPlanId).catch(() => undefined);
      return NextResponse.json({ id: row.id, planId: resolvedPlanId });
    }

    const existing = await prisma.planPremise.findFirst({
      where: { planId: resolvedPlanId, code: data.code },
    });
    if (existing) {
      const row = await prisma.planPremise.update({
        where: { id: existing.id },
        data: payload,
      });
      await syncPlanPremisesToAssumptions(resolvedPlanId).catch(() => undefined);
      return NextResponse.json({ id: row.id, planId: resolvedPlanId });
    }

    const row = await prisma.planPremise.create({
      data: { planId: resolvedPlanId, ...payload },
    });
    await syncPlanPremisesToAssumptions(resolvedPlanId).catch(() => undefined);
    return NextResponse.json({ id: row.id, planId: resolvedPlanId });
  }

  if (!northStarId) {
    return NextResponse.json({ error: "planId or northStarId required" }, { status: 400 });
  }

  if (id) {
    const row = await prisma.compassPremiseAudit.update({
      where: { id },
      data: payload,
    });
    return NextResponse.json({ id: row.id });
  }

  const row = await prisma.compassPremiseAudit.create({
    data: { northStarId, ...payload },
  });
  return NextResponse.json({ id: row.id });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const planId = searchParams.get("planId");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  if (planId) {
    await prisma.planPremise.delete({ where: { id } });
    await syncPlanPremisesToAssumptions(planId).catch(() => undefined);
    return NextResponse.json({ ok: true });
  }

  try {
    await prisma.planPremise.delete({ where: { id } });
    const { plan } = await getActiveStrategicPlan();
    if (plan?.id) await syncPlanPremisesToAssumptions(plan.id).catch(() => undefined);
    return NextResponse.json({ ok: true });
  } catch {
    await prisma.compassPremiseAudit.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  }
}
