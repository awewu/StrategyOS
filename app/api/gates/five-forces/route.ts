import { NextResponse } from "next/server";
import { requireApiMinLevel } from "@/lib/auth/api-guard";
import { getFiveForceRecords, saveFiveForceRecord } from "@/lib/gates/five-forces";
import type { FiveForceRecord } from "@/lib/gates/five-forces";

export async function GET() {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;
  const { records, source } = await getFiveForceRecords();
  return NextResponse.json({ records, source });
}

export async function PUT(req: Request) {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;
  try {
    const body = (await req.json()) as { record?: Partial<FiveForceRecord>; period?: string };
    if (!body.record || !body.record.force || !body.record.threatLevel) {
      return NextResponse.json({ error: "缺少 force 或 threatLevel" }, { status: 400 });
    }
    const { record, source } = await saveFiveForceRecord(
      body.record as Pick<
        FiveForceRecord,
        "force" | "threatLevel" | "evidence" | "linkedAssumptionCode" | "owner" | "mitigated" | "note"
      >,
      body.period,
    );
    return NextResponse.json({ ok: true, record, source });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "保存失败" },
      { status: 500 },
    );
  }
}
