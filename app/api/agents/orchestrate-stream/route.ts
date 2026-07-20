import { runAgentOrchestrationStreaming } from "@/lib/stratos/llm-orchestration";
import { requireApiMinLevel } from "@/lib/auth/api-guard";
import { DEMO_SHEET_IMPORT } from "@/lib/stratos/report-agent";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;

  const body = (await request.json()) as {
    reportId?: string;
    rawContent?: string;
    useLlm?: boolean;
  };
  const reportId = body.reportId ?? "rpt-sheet1-may";
  const rawContent = body.rawContent ?? DEMO_SHEET_IMPORT;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      try {
        const gen = runAgentOrchestrationStreaming(
          reportId,
          rawContent,
          "2026-05",
          body.useLlm !== false
        );

        for await (const evt of gen) {
          if (evt.type === "step") {
            send("step", {
              agentId: evt.step.agentId,
              name: evt.step.name,
              status: evt.step.status,
              output: evt.step.output,
              durationMs: evt.step.durationMs,
              index: evt.index,
              total: evt.total,
            });
          } else if (evt.type === "done") {
            send("done", evt.result);
          } else if (evt.type === "error") {
            send("error", { message: evt.message });
          }
        }
      } catch (err) {
        send("error", { message: err instanceof Error ? err.message : "Stream error" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
