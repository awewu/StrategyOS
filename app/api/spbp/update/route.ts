import { NextResponse } from "next/server";
import { logUsageEvent } from "@/lib/audit/log-event";
import { dbAvailable, prisma } from "@/lib/db";
import { updateScenarioProbabilities } from "@/lib/stratos/spbp-bayes";
import { getActivePeriod } from "@/lib/data/active-period";
import * as demo from "@/lib/stratos-demo-data";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    favorsOptimistic?: boolean;
    favorsPessimistic?: boolean;
    strength?: number;
  };

  const period = await getActivePeriod();
  const evidence = {
    favorsOptimistic: body.favorsOptimistic,
    favorsPessimistic: body.favorsPessimistic,
    strength: body.strength ?? 0.12,
  };

  if (await dbAvailable()) {
    const rows = await prisma.spbpScenario.findMany({ where: { period } });
    if (rows.length > 0) {
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
      const updated = updateScenarioProbabilities(mapped, evidence);
      for (const sc of updated) {
        await prisma.spbpScenario.update({
          where: { code: sc.id },
          data: { probability: sc.probability },
        });
      }
      await logUsageEvent({
        action: "spbp_update",
        resource: period,
        request,
        metadata: { source: "database", ...evidence },
      });
      return NextResponse.json({ scenarios: updated, source: "database" });
    }
  }

  const updated = updateScenarioProbabilities(demo.spbpScenarios, evidence);
  await logUsageEvent({
    action: "spbp_update",
    resource: period,
    request,
    metadata: { source: "demo", ...evidence },
  });
  return NextResponse.json({ scenarios: updated, source: "demo" });
}
