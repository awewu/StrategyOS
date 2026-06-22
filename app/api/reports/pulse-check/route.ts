import { NextResponse } from "next/server";
import { checkPulseDuplicate } from "@/lib/reports/pulse-dedup";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      orgUnitId?: string;
      period?: string;
      oneLiner?: string;
      offTrackKr?: string;
      needHelp?: string;
    };

    if (!body.orgUnitId || !body.oneLiner?.trim()) {
      return NextResponse.json({ error: "orgUnitId 与 oneLiner 必填" }, { status: 400 });
    }

    const period = body.period ?? new Date().toISOString().slice(0, 7);
    const result = await checkPulseDuplicate(body.orgUnitId, period, {
      oneLiner: body.oneLiner.trim(),
      offTrackKr: body.offTrackKr?.trim(),
      needHelp: body.needHelp?.trim(),
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "查重失败" }, { status: 500 });
  }
}
