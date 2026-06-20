import { NextResponse, type NextRequest } from "next/server";
import { logUsageEvent } from "@/lib/audit/log-event";
import {
  runCounterfactual,
  type CounterfactualInput,
  type CounterfactualType,
} from "@/lib/stratos/counterfactual";
import { snapshotFY26 } from "@/lib/stratos-demo-data";

const VALID_TYPES: CounterfactualType[] = ["v4_delay", "hotel_beat", "price_cut"];

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Partial<CounterfactualInput>;

  if (!body.type || !VALID_TYPES.includes(body.type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const magnitude = typeof body.magnitude === "number" ? body.magnitude : 1;
  const result = runCounterfactual(snapshotFY26, { type: body.type, magnitude });

  await logUsageEvent({
    action: "counterfactual_run",
    resource: result.id,
    metadata: { type: body.type, magnitude },
    request,
  });

  return NextResponse.json(result);
}
