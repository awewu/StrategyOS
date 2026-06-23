import { NextResponse, type NextRequest } from "next/server";
import { requireApiMinLevel } from "@/lib/auth/api-guard";
import { logUsageEvent } from "@/lib/audit/log-event";
import {
  runCounterfactual,
  type CounterfactualInput,
  type CounterfactualType,
} from "@/lib/stratos/counterfactual";
import { applyForecastBias } from "@/lib/stratos/calibrate";
import { buildWorkingSnapshotState } from "@/lib/data/snapshot-state";
import { getForecastCalibration } from "@/lib/data/calibration-data";
import { getDataSource } from "@/lib/data/strategy-data";
import type { SnapshotStatePayload } from "@/lib/types/stratos";

const VALID_TYPES: CounterfactualType[] = ["v4_delay", "hotel_beat", "price_cut"];

export async function POST(request: NextRequest) {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;
  const body = (await request.json()) as Partial<CounterfactualInput>;

  if (!body.type || !VALID_TYPES.includes(body.type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const magnitude = typeof body.magnitude === "number" ? body.magnitude : 1;

  // Live baseline (DB-backed) + history-calibrated forecast — no demo hardcode.
  const [baseline, calibration, source] = await Promise.all([
    buildWorkingSnapshotState(),
    getForecastCalibration(),
    getDataSource(),
  ]);

  const debiased: SnapshotStatePayload = baseline.fpa
    ? {
        ...baseline,
        fpa: {
          ...baseline.fpa,
          revenueForecast: applyForecastBias(baseline.fpa.revenueForecast, calibration),
          profitForecast: applyForecastBias(baseline.fpa.profitForecast, calibration),
        },
      }
    : baseline;

  const result = runCounterfactual(debiased, { type: body.type, magnitude });

  await logUsageEvent({
    action: "counterfactual_run",
    resource: result.id,
    metadata: { type: body.type, magnitude, source, biasPct: calibration.biasPct, n: calibration.n },
    request,
  });

  return NextResponse.json({ ...result, calibration, source });
}
