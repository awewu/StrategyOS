import { NextResponse } from "next/server";
import { requireApiMinLevel } from "@/lib/auth/api-guard";
import { logUsageEvent } from "@/lib/audit/log-event";
import { runSpbpQuarterlyUpdate } from "@/lib/stratos/spbp-quarterly";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;

  const body = (await request.json().catch(() => ({}))) as {
    reportId?: string;
    rawContent?: string;
  };

  const result = await runSpbpQuarterlyUpdate(body.reportId, body.rawContent);

  await logUsageEvent({
    action: "spbp_update",
    resource: result.period,
    request,
    metadata: {
      source: result.source,
      scenarioCount: result.scenarios.length,
      strength: result.evidence.strength,
    },
  });

  return NextResponse.json(result);
}
