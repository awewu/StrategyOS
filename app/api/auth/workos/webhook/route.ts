import { NextResponse, type NextRequest } from "next/server";
import { logUsageEvent } from "@/lib/audit/log-event";
import { handleWorkOSEvent, verifyWorkOSWebhook } from "@/lib/auth/workos-webhook";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const secret = process.env.WORKOS_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "WORKOS_WEBHOOK_SECRET not configured" }, { status: 501 });
  }

  const raw = await request.text();
  const sig = request.headers.get("workos-signature");

  if (!verifyWorkOSWebhook(raw, sig, secret)) {
    await logUsageEvent({
      action: "auth_failed",
      resource: "workos_webhook",
      metadata: { reason: "invalid_signature" },
      request,
    });
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let evt: { id: string; event: string; data: Record<string, unknown> };
  try {
    evt = JSON.parse(raw) as typeof evt;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (!evt?.event || typeof evt.event !== "string") {
    return NextResponse.json({ error: "Missing event type" }, { status: 400 });
  }

  const result = await handleWorkOSEvent(evt);

  await logUsageEvent({
    action: "workos_webhook",
    resource: evt.event,
    metadata: { eventId: evt.id, ...result },
    request,
  });

  return NextResponse.json({ ok: true, ...result });
}
