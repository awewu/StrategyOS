import { NextResponse } from "next/server";
import { requireApiMinLevel } from "@/lib/auth/api-guard";
import { getSession } from "@/lib/auth/session";
import { logUsageEvent } from "@/lib/audit/log-event";
import {
  createBudgetVersion,
  listBudgetVersions,
  transitionBudgetVersion,
  type BudgetAction,
} from "@/lib/finance/budget-versions";

export async function GET() {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;
  return NextResponse.json({ versions: await listBudgetVersions() });
}

export async function POST(req: Request) {
  const denied = await requireApiMinLevel(3);
  if (denied) return denied;
  try {
    const body = (await req.json()) as {
      fiscalYear?: string;
      name?: string;
      scenarioCode?: string;
      notes?: string;
    };
    if (!body.fiscalYear || !body.name) {
      return NextResponse.json({ error: "缺少 fiscalYear / name" }, { status: 400 });
    }
    const session = await getSession().catch(() => null);
    const version = await createBudgetVersion({
      fiscalYear: body.fiscalYear,
      name: body.name,
      scenarioCode: body.scenarioCode,
      notes: body.notes,
      createdBy: session?.email ?? null,
    });
    await logUsageEvent({
      action: "budget_version_update",
      resource: "/api/fpa/budget-versions",
      metadata: { op: "create", id: version.id, fiscalYear: version.fiscalYear },
      request: req,
    });
    return NextResponse.json({ version });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "创建失败" },
      { status: 400 },
    );
  }
}

export async function PATCH(req: Request) {
  const denied = await requireApiMinLevel(3);
  if (denied) return denied;
  try {
    const body = (await req.json()) as { id?: string; action?: BudgetAction; note?: string };
    if (!body.id || !body.action) {
      return NextResponse.json({ error: "缺少 id / action" }, { status: 400 });
    }
    const session = await getSession().catch(() => null);
    const version = await transitionBudgetVersion({
      id: body.id,
      action: body.action,
      actor: session?.email ?? null,
      note: body.note,
    });
    await logUsageEvent({
      action: "budget_version_update",
      resource: "/api/fpa/budget-versions",
      metadata: { op: body.action, id: version.id, status: version.status },
      request: req,
    });
    return NextResponse.json({ version });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "操作失败" },
      { status: 400 },
    );
  }
}
