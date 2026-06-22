import { NextResponse } from "next/server";
import { requireApiMinLevel } from "@/lib/auth/api-guard";
import { getWushiAssessment, saveWushiAssessment } from "@/lib/culture/wushi-access";
import type { WushiAssessment } from "@/lib/culture/wushi";

export async function GET() {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;
  const { assessment, source } = await getWushiAssessment();
  return NextResponse.json({ assessment, source });
}

export async function PUT(req: Request) {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;
  try {
    const body = (await req.json()) as { assessment?: WushiAssessment; period?: string };
    if (!body.assessment) {
      return NextResponse.json({ error: "缺少 assessment" }, { status: 400 });
    }
    const { assessment, source } = await saveWushiAssessment(body.assessment, body.period);
    return NextResponse.json({ ok: true, assessment, source });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "保存失败" },
      { status: 500 },
    );
  }
}
