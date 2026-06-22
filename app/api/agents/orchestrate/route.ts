import { NextResponse } from "next/server";
import { logUsageEvent } from "@/lib/audit/log-event";
import { dbAvailable, prisma } from "@/lib/db";
import { llmConfigured } from "@/lib/stratos/llm-agent";
import { runAgentOrchestrationSmart } from "@/lib/stratos/llm-orchestration";
import { DEMO_SHEET_IMPORT } from "@/lib/stratos/report-agent";
import { getActivePeriod } from "@/lib/data/active-period";
import { persistHealthAssertionsFromTriggers } from "@/lib/data/health-assertion-data";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    reportId?: string;
    rawContent?: string;
    useLlm?: boolean;
  };
  const reportId = body.reportId ?? "rpt-sheet1-may";
  const rawContent = body.rawContent ?? DEMO_SHEET_IMPORT;

  const result = await runAgentOrchestrationSmart(
    reportId,
    rawContent,
    "2026-05",
    body.useLlm !== false
  );

  if (await dbAvailable()) {
    const existing = await prisma.report.findFirst({
      where: { title: { contains: "Sheet1" } },
    });
    const payload = { orchestration: result, parsed: result.parsed, engine: result.engine };
    if (existing) {
      await prisma.report.update({
        where: { id: existing.id },
        data: { parsedJson: payload as object, rawContent },
      });
    }
    if (result.parsed.assertionTriggers.length > 0) {
      await persistHealthAssertionsFromTriggers(result.parsed.assertionTriggers, reportId);
    }
    const period = await getActivePeriod();
    for (const sc of result.spbpScenarios) {
      await prisma.spbpScenario.updateMany({
        where: { code: sc.id, period },
        data: { probability: sc.probability },
      });
    }
  }

  await logUsageEvent({
    action: "agent_orchestrate",
    resource: reportId,
    request,
    metadata: { engine: result.engine, steps: result.steps.length },
  });

  return NextResponse.json({
    ...result,
    dbPersisted: await dbAvailable(),
    llmAvailable: llmConfigured(),
  });
}

export async function GET() {
  const { STRAT_AGENTS } = await import("@/lib/stratos/agents");
  return NextResponse.json({ agents: STRAT_AGENTS, llmConfigured: llmConfigured() });
}
