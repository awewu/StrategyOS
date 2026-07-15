import { NextResponse } from "next/server";
import { getActivePeriod } from "@/lib/data/active-period";
import {
  getKpiHealthMetrics,
  saveKpiHealthMetrics,
  type KpiHealthPayload,
  type KpiUnit,
} from "@/lib/fpa/kpi-health";

const UNITS: KpiUnit[] = ["percent", "currency", "ratio", "months", "count"];

export async function GET() {
  return NextResponse.json(await getKpiHealthMetrics(await getActivePeriod()));
}

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as { period?: string; metrics?: KpiHealthPayload[] };
    if (!Array.isArray(body.metrics)) {
      return NextResponse.json({ error: "缺少 metrics 数组" }, { status: 400 });
    }
    const seen = new Set<string>();
    for (const m of body.metrics) {
      const name = (m.name ?? "").trim();
      if (!name) return NextResponse.json({ error: "指标名称不能为空" }, { status: 400 });
      if (name.length > 80) return NextResponse.json({ error: `指标名称过长：${name}` }, { status: 400 });
      if (seen.has(name)) return NextResponse.json({ error: `指标名称重复：${name}` }, { status: 400 });
      seen.add(name);
      if (m.unit && !UNITS.includes(m.unit)) {
        return NextResponse.json({ error: `非法单位：${m.unit}` }, { status: 400 });
      }
    }
    const period = body.period ?? (await getActivePeriod());
    return NextResponse.json(await saveKpiHealthMetrics(body.metrics, period));
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "保存失败" },
      { status: 400 },
    );
  }
}
