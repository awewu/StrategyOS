import { NextResponse } from "next/server";
import { runRuntimeHarness } from "@/lib/harness/runner";

export async function GET() {
  const report = await runRuntimeHarness();
  return NextResponse.json(report, { status: report.exitCode === 0 ? 200 : 503 });
}
