import { getFpaSummary } from "@/lib/data/strategy-data";
import { buildManagementReport } from "@/lib/fpa/management-report";
import { NextResponse } from "next/server";

export async function GET() {
  const fpa = await getFpaSummary();
  const report = buildManagementReport(fpa);
  return NextResponse.json(report);
}
