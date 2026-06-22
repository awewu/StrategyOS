import { NextRequest, NextResponse } from "next/server";
import { buildHealthPayload, renderHealthHtml } from "@/lib/health/payload";

function resolveHttpStatus(payload: Awaited<ReturnType<typeof buildHealthPayload>>, probe: string | null): number {
  // Liveness: process is up — always 200. Readiness: fail when DB unavailable.
  if (probe === "readiness" && payload.status !== "ok") return 503;
  return 200;
}

export async function GET(request: NextRequest) {
  const payload = await buildHealthPayload();
  const format = request.nextUrl.searchParams.get("format");
  const probe = request.nextUrl.searchParams.get("probe");
  const accept = request.headers.get("accept") ?? "";
  const httpStatus = resolveHttpStatus(payload, probe);

  const wantsJson =
    format === "json" ||
    (format !== "html" && accept.includes("application/json") && !accept.includes("text/html"));

  if (!wantsJson) {
    return new NextResponse(renderHealthHtml(payload), {
      status: httpStatus,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  return NextResponse.json(
    {
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
      probe: probe ?? "liveness",
    },
    { status: httpStatus },
  );
}
