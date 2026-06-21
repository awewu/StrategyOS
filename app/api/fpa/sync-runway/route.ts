import { NextResponse } from "next/server";
import { dbAvailable } from "@/lib/db";
import { syncRunwayFromFpa } from "@/lib/fpa/runway-sync";

export async function POST() {
  if (!(await dbAvailable())) {
    return NextResponse.json({ error: "db unavailable" }, { status: 503 });
  }
  try {
    const result = await syncRunwayFromFpa();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "sync failed" }, { status: 500 });
  }
}
