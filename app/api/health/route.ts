import { NextRequest, NextResponse } from "next/server";
import { buildHealthPayload, renderHealthHtml } from "@/lib/health/payload";

export async function GET(request: NextRequest) {
  const payload = await buildHealthPayload();
  const format = request.nextUrl.searchParams.get("format");
  const accept = request.headers.get("accept") ?? "";

  const wantsJson =
    format === "json" ||
    (format !== "html" && accept.includes("application/json") && !accept.includes("text/html"));

  if (!wantsJson) {
    return new NextResponse(renderHealthHtml(payload), {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  return NextResponse.json({
    status: payload.status === "ok" ? "ok" : "degraded",
    mode: payload.mode,
    dataSource: payload.dataSource,
    capabilities: {
      db: payload.capabilities.db,
      workos: payload.capabilities.workos,
      llm: payload.capabilities.llm,
      fonts: payload.capabilities.fonts,
    },
    version: payload.version,
    counts: payload.counts,
    notes: payload.notes,
  });
}
