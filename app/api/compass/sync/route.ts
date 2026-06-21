import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { refreshCompassAudit } from "@/lib/compass/sync-audit";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { mode?: "all" | "assumptions" | "signals" };
    const mode = body.mode ?? "all";

    const ns = await prisma.companyNorthStar.findFirst({ where: { active: true } });
    if (!ns) {
      return NextResponse.json({ error: "请先录入使命愿景" }, { status: 400 });
    }

    const result = await refreshCompassAudit(ns.id, {
      assumptions: mode === "all" || mode === "assumptions",
      signals: mode === "all" || mode === "signals",
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "sync failed";
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}
