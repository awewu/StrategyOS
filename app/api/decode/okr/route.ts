import { NextResponse } from "next/server";
import { requireApiMinLevel } from "@/lib/auth/api-guard";
import { dbAvailable } from "@/lib/db";
import { draftOkrFromHoshin, getOkrBundle, saveOkr, type SaveOkrPayload } from "@/lib/decode/okr-access";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const denied = await requireApiMinLevel(0);
  if (denied) return denied;
  const url = new URL(req.url);
  if (url.searchParams.get("draft") === "hoshin") {
    if (!(await dbAvailable())) {
      return NextResponse.json({ error: "database unavailable" }, { status: 503 });
    }
    return NextResponse.json({ draft: await draftOkrFromHoshin() });
  }
  const bundle = await getOkrBundle();
  return NextResponse.json(bundle);
}

export async function PUT(req: Request) {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;
  if (!(await dbAvailable())) {
    return NextResponse.json({ error: "database unavailable" }, { status: 503 });
  }
  try {
    const payload = (await req.json()) as SaveOkrPayload;
    if (!Array.isArray(payload.objectives)) {
      return NextResponse.json({ error: "objectives required" }, { status: 400 });
    }
    const bundle = await saveOkr(payload);
    return NextResponse.json(bundle);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "保存失败" },
      { status: 400 },
    );
  }
}
