import { NextResponse } from "next/server";
import { requireApiMinLevel } from "@/lib/auth/api-guard";
import { getSpbpEditable, saveSpbpScenarios } from "@/lib/fpa/spbp-access";
import type { Scenario } from "@/lib/types/stratos";
import { getActivePeriod } from "@/lib/data/active-period";

export async function GET() {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;
  const bundle = await getSpbpEditable(await getActivePeriod());
  return NextResponse.json(bundle);
}

export async function PUT(req: Request) {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;
  try {
    const body = (await req.json()) as { scenarios?: Scenario[]; period?: string };
    if (!body.scenarios) return NextResponse.json({ error: "scenarios 必填" }, { status: 400 });
    const saved = await saveSpbpScenarios(body.scenarios, body.period ?? await getActivePeriod());
    return NextResponse.json({ ok: true, scenarios: saved, source: "database" as const });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "保存失败" }, { status: 500 });
  }
}
