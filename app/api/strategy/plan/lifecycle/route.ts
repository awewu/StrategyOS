import { NextResponse } from "next/server";
import { requireApiAdmin, requireApiMinLevel } from "@/lib/auth/api-guard";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import {
  fetchPlanLifecycle,
  PLAN_HORIZON_END,
  PLAN_HORIZON_START,
  transitionPlanLifecycle,
  type PlanLifecycleAction,
} from "@/lib/strategy/plan-lifecycle";

const VALID_ACTIONS = new Set<PlanLifecycleAction>(["submit", "lock", "reopen"]);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orgUnitId = searchParams.get("orgUnitId");
    if (!orgUnitId) {
      return NextResponse.json({ error: "orgUnitId required" }, { status: 400 });
    }

    const horizonStart = Number(searchParams.get("horizonStart") ?? PLAN_HORIZON_START);
    const horizonEnd = Number(searchParams.get("horizonEnd") ?? PLAN_HORIZON_END);

    const lifecycle = await fetchPlanLifecycle(orgUnitId, horizonStart, horizonEnd);
    return NextResponse.json({ ok: true, lifecycle });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;

  try {
    const body = (await req.json()) as {
      orgUnitId?: string;
      horizonStart?: number;
      horizonEnd?: number;
      action?: PlanLifecycleAction;
    };

    const { orgUnitId, action, horizonStart, horizonEnd } = body;
    if (!orgUnitId || !action || !VALID_ACTIONS.has(action)) {
      return NextResponse.json({ error: "orgUnitId 与 action 必填（submit | lock | reopen）" }, { status: 400 });
    }

    if (action === "lock" || action === "reopen") {
      const adminDenied = await requireApiAdmin();
      if (adminDenied) return adminDenied;
    }

    const session = await getSession();
    let submitterId: string | null = null;
    if (session?.userId) {
      const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { id: true } });
      submitterId = user?.id ?? null;
    }

    const result = await transitionPlanLifecycle({
      orgUnitId,
      horizonStart,
      horizonEnd,
      action,
      submitterId,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const lifecycle = await fetchPlanLifecycle(orgUnitId, horizonStart ?? PLAN_HORIZON_START, horizonEnd ?? PLAN_HORIZON_END);
    return NextResponse.json({ ok: true, status: result.status, lifecycle });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
