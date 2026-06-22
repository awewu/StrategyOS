import { NextResponse } from "next/server";
import { requireApiMinLevel } from "@/lib/auth/api-guard";
import { getMaPipelineEditable, saveMaPipelineItems } from "@/lib/fpa/ma-pipeline-access";
import type { MaPipelineItem } from "@/lib/types/stratos";
import * as demo from "@/lib/stratos-demo-data";

export async function GET() {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;
  const bundle = await getMaPipelineEditable(demo.CURRENT_PERIOD);
  return NextResponse.json(bundle);
}

export async function PUT(req: Request) {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;
  try {
    const body = (await req.json()) as { items?: MaPipelineItem[]; period?: string };
    if (!body.items) return NextResponse.json({ error: "items 必填" }, { status: 400 });
    const saved = await saveMaPipelineItems(body.items, body.period ?? demo.CURRENT_PERIOD);
    return NextResponse.json({ ok: true, items: saved, source: "database" as const });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "保存失败" }, { status: 500 });
  }
}
