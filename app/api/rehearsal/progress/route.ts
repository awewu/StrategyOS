import { NextResponse, type NextRequest } from "next/server";
import { logUsageEvent } from "@/lib/audit/log-event";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    stepId?: string;
    item?: string;
    checked?: boolean;
    segment?: string;
  };

  if (!body.stepId || !body.item) {
    return NextResponse.json({ error: "stepId and item required" }, { status: 400 });
  }

  await logUsageEvent({
    action: "rehearsal_checklist",
    resource: `${body.stepId}:${body.item}`,
    metadata: {
      checked: body.checked ?? true,
      segment: body.segment,
    },
    request,
  });

  return NextResponse.json({ ok: true });
}
