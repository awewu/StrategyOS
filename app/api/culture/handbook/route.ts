import { NextResponse } from "next/server";
import { requireApiMinLevel } from "@/lib/auth/api-guard";
import type { CultureHandbookContent } from "@/lib/culture/content";
import { getCultureHandbook, saveCultureHandbook } from "@/lib/culture/handbook-access";
import * as demo from "@/lib/stratos-demo-data";

export async function GET() {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;
  const bundle = await getCultureHandbook(demo.CURRENT_PERIOD);
  return NextResponse.json(bundle);
}

export async function PUT(req: Request) {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;
  try {
    const body = (await req.json()) as { handbook?: CultureHandbookContent; period?: string };
    if (!body.handbook) {
      return NextResponse.json({ error: "handbook 必填" }, { status: 400 });
    }
    const saved = await saveCultureHandbook(body.handbook, body.period ?? demo.CURRENT_PERIOD);
    return NextResponse.json({ ok: true, ...saved });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "保存失败" }, { status: 500 });
  }
}
