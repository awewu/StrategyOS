import { NextResponse } from "next/server";
import { logUsageEvent } from "@/lib/audit/log-event";
import { USAGE_ACTIONS, type UsageAction } from "@/lib/audit/types";

const CLIENT_ACTIONS = new Set<UsageAction>([
  "snapshot_freeze",
  "role_switch",
]);

const INTERNAL_ACTIONS = new Set<UsageAction>(["auth_failed"]);

export async function POST(request: Request) {
  const body = (await request.json()) as {
    action?: string;
    resource?: string;
    metadata?: Record<string, unknown>;
  };

  const action = body.action as UsageAction | undefined;
  if (!action || !USAGE_ACTIONS.includes(action)) {
    return NextResponse.json({ error: "invalid action" }, { status: 400 });
  }

  const isInternal = request.headers.get("x-stratos-internal") === "1";
  const allowed =
    CLIENT_ACTIONS.has(action) || (isInternal && INTERNAL_ACTIONS.has(action));
  if (!allowed) {
    return NextResponse.json({ error: "action not allowed" }, { status: 403 });
  }
  if (!body.resource?.trim()) {
    return NextResponse.json({ error: "resource required" }, { status: 400 });
  }

  const record = await logUsageEvent({
    action,
    resource: body.resource.trim(),
    metadata: body.metadata,
    request,
  });

  return NextResponse.json({ ok: true, id: record.id });
}
