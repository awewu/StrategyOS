import { NextResponse } from "next/server";
import { requireApiMinLevel } from "@/lib/auth/api-guard";
import { logUsageEvent } from "@/lib/audit/log-event";
import { dbAvailable, prisma } from "@/lib/db";
import { llmConfigured, parseReportSmart } from "@/lib/stratos/llm-agent";
import { DEMO_SHEET_IMPORT, parseReportContent } from "@/lib/stratos/report-agent";
import { updateScenarioProbabilities } from "@/lib/stratos/spbp-bayes";
import { getActivePeriod } from "@/lib/data/active-period";
import { persistHealthAssertionsFromTriggers } from "@/lib/data/health-assertion-data";
import * as demo from "@/lib/stratos-demo-data";

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
  const useLlm = body.useLlm !== false;

  const { parsed, engine } = await parseReportSmart(reportId, rawContent, "2026-05", useLlm);
  let dbPersisted = false;

  if (await dbAvailable()) {
    dbPersisted = true;
    const existing = await prisma.report.findFirst({
      where: { title: { contains: "Sheet1" } },
    });
    const payload = { ...parsed, engine };
    if (existing) {
      await prisma.report.update({
        where: { id: existing.id },
        data: { parsedJson: payload as object, rawContent },
      });
    } else {
      await prisma.report.create({
        data: {
          reportType: "SHEET_IMPORT",
          period: "2026-05",
          title: "Sheet1 财务 Excel",
          rawContent,
          parsedJson: payload as object,
        },
      });
    }

    if (parsed.assertionTriggers.length > 0) {
      await persistHealthAssertionsFromTriggers(parsed.assertionTriggers, reportId);
    }

    const rows = await prisma.spbpScenario.findMany({ where: { period: await getActivePeriod() } });
    if (rows.length > 0 && parsed.assertionTriggers.length > 0) {
      const mapped = rows.map((r) => ({
        id: r.code,
        name: r.name,
        probability: Number(r.probability),
        drivers: r.drivers,
        fpaImpact: {
          revenue: Number(r.revenueImpact),
          profit: Number(r.profitImpact),
          runwayMonths: Number(r.runwayMonths),
        },
        linkedAssumptionCodes: r.linkedAssumptionCodes,
      }));
      const updated = updateScenarioProbabilities(mapped, {
        favorsPessimistic: true,
        strength: 0.1,
      });
      for (const sc of updated) {
        await prisma.spbpScenario.update({
          where: { code: sc.id },
          data: { probability: sc.probability },
        });
      }
    }
  }

  const scenarioPreview = updateScenarioProbabilities(demo.spbpScenarios, {
    favorsPessimistic: parsed.assertionTriggers.length > 0,
    strength: 0.1,
  });

  await logUsageEvent({
    action: "report_parse",
    resource: reportId,
    request,
    metadata: { engine, dbPersisted, triggers: parsed.assertionTriggers.length },
  });

  return NextResponse.json({
    parsed,
    engine,
    llmAvailable: llmConfigured(),
    spbpUpdated: scenarioPreview,
    dbPersisted,
  });
}

/** Rule-only fast path for tests */
export async function GET() {
  return NextResponse.json({
    llmConfigured: llmConfigured(),
    fallback: "rules",
    demoParse: parseReportContent("demo", DEMO_SHEET_IMPORT, "2026-05"),
  });
}
