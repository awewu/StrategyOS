import { getFpaSummary } from "@/lib/data/strategy-data";
import { buildManagementReport } from "@/lib/fpa/management-report";
import { getActivePeriod } from "@/lib/data/active-period";
import { NextResponse } from "next/server";

export async function GET() {
  const [fpa, activePeriod] = await Promise.all([getFpaSummary(), getActivePeriod()]);
  const report = buildManagementReport(fpa, activePeriod);
  return NextResponse.json(report);
}
