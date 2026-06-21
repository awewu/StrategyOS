import { NextResponse } from "next/server";
import { requireApiMinLevel } from "@/lib/auth/api-guard";
import { getInboxSummary } from "@/lib/inbox/count";

export async function GET() {
  const denied = await requireApiMinLevel(3);
  if (denied) return denied;

  const summary = await getInboxSummary();
  return NextResponse.json(summary);
}
