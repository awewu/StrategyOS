import { NextResponse } from "next/server";
import { getDataSourceMeta } from "@/lib/data/data-source-meta";
import { logUsageEvent } from "@/lib/audit/log-event";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const meta = await getDataSourceMeta();
  await logUsageEvent({
    action: "data_source_read",
    resource: "meta",
    request,
    metadata: { source: meta.source, signal: meta.signal },
  });
  return NextResponse.json(meta);
}
