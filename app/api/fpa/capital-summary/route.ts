import { getCapitalSummaryLine } from "@/lib/data/entity-getters";
import { NextResponse } from "next/server";

export async function GET() {
  const summary = await getCapitalSummaryLine();
  return NextResponse.json({ summary });
}
