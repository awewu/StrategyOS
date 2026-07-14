import { NextResponse } from "next/server";
import { requireApiMinLevel } from "@/lib/auth/api-guard";
import { getEffectiveRole, getEffectiveSession } from "@/lib/auth/guard";
import { computeNotifications } from "@/lib/notify/notifications";

export const runtime = "nodejs";

export async function GET() {
  const denied = await requireApiMinLevel(0);
  if (denied) return denied;
  const [role, session] = await Promise.all([getEffectiveRole(), getEffectiveSession()]);
  const notifications = await computeNotifications(role, session?.name);
  return NextResponse.json({ notifications });
}
