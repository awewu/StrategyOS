import { NextResponse } from "next/server";
import { logUsageEvent } from "@/lib/audit/log-event";
import { dbAvailable, prisma } from "@/lib/db";
import { llmConfigured, parseReportSmart } from "@/lib/stratos/llm-agent";
import { DEMO_SHEET_IMPORT, parseReportContent } from "@/lib/stratos/report-agent";
import { updateScenarioProbabilities } from "@/lib/stratos/spbp-bayes";
import * as demo from "@/lib/stratos-demo-data";

export const runtime = "nodejs";

export async function POST(request: Request) {
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
      const active = await prisma.healthAssertion.findFirst({
        where: { assertionType: "runway", active: true },
      });
      if (!active) {
        await prisma.healthAssertion.create({
          data: {
            assertionType: "runway",
            active: true,
            triggeredAt: new Date(),
            message: "一票否决：现金 runway 2.1 月（Agent 触发）",
            metricValue: 2.1,
            thresholdValue: 3,
          },
        });
      }
    }

    const rows = await prisma.spbpScenario.findMany({ where: { period: "2026-FY" } });
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
