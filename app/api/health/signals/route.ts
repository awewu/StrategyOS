import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiMinLevel, requireMutationGate } from "@/lib/auth/api-guard";
import { getActivePeriod } from "@/lib/data/active-period";

export const runtime = "nodejs";

const DIMENSIONS = ["financial", "customer", "process", "learning"] as const;
const SIGNALS = ["green", "yellow", "red"];

export async function GET() {
  const period = await getActivePeriod();
  const rows = await prisma.healthSignal.findMany({ where: { period } });
  const lights: Record<string, string> = {};
  for (const r of rows) {
    if ((DIMENSIONS as readonly string[]).includes(r.dimension)) lights[r.dimension] = r.signal;
  }
  const kpis = rows
    .filter((r) => r.kpiName)
    .map((r) => ({
      kpiName: r.kpiName!,
      kpiValue: r.kpiValue ?? "",
      kpiTarget: r.kpiTarget ?? "",
      signal: r.signal,
      kpiCode: r.kpiCode ?? "",
      bscDimension: r.bscDimension ?? "",
    }));
  return NextResponse.json({ period, lights, kpis });
}

/** 整期替换：BSC 四灯 + 核心 KPI 行 */
export async function PUT(req: Request) {
  const gate = await requireMutationGate();
  if (gate) return gate;
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;
  try {
    const b = await req.json();
    const lights = b.lights ?? {};
    const kpis: Array<{ kpiName: string; kpiValue: string; kpiTarget: string; signal: string; kpiCode?: string; bscDimension?: string }> =
      Array.isArray(b.kpis) ? b.kpis : [];
    for (const dim of DIMENSIONS) {
      if (!SIGNALS.includes(lights[dim])) {
        return NextResponse.json({ error: `${dim} 灯需为 green/yellow/red` }, { status: 400 });
      }
    }
    for (const k of kpis) {
      if (!k.kpiName?.trim()) return NextResponse.json({ error: "KPI 名称必填" }, { status: 400 });
      if (!SIGNALS.includes(k.signal)) return NextResponse.json({ error: "KPI 信号非法" }, { status: 400 });
      const bd = k.bscDimension?.trim();
      if (bd && !(DIMENSIONS as readonly string[]).includes(bd)) {
        return NextResponse.json({ error: "KPI 关联维度需为 financial/customer/process/learning 或留空" }, { status: 400 });
      }
    }
    const period = await getActivePeriod();
    const now = new Date();
    await prisma.$transaction([
      prisma.healthSignal.deleteMany({ where: { period } }),
      prisma.healthSignal.createMany({
        data: [
          ...DIMENSIONS.map((dim) => ({
            period,
            dimension: dim,
            signal: lights[dim],
            recordedAt: now,
          })),
          ...kpis.map((k) => ({
            period,
            dimension: "kpi",
            signal: k.signal as never,
            kpiName: k.kpiName.trim().slice(0, 100),
            kpiValue: k.kpiValue?.trim().slice(0, 50) || null,
            kpiTarget: k.kpiTarget?.trim().slice(0, 50) || null,
            kpiCode: k.kpiCode?.trim().slice(0, 40) || null,
            bscDimension: k.bscDimension?.trim() || null,
            recordedAt: now,
          })),
        ],
      }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "保存失败" }, { status: 500 });
  }
}
