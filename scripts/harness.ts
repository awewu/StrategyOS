#!/usr/bin/env npx tsx
/**
 * StratOS full self-check harness.
 * Usage:
 *   npm run harness          # quick (default)
 *   npm run harness:full     # + lint + build + http smoke
 *   npm run harness:ci       # CI profile
 *   npm run harness -- --json
 */
import fs from "fs";
import path from "path";
import { formatHarnessReport, runHarness } from "../lib/harness/runner";
import type { HarnessOptions } from "../lib/harness/types";

async function main() {
  const args = process.argv.slice(2);
  const options: HarnessOptions = {
    profile: args.includes("--full") ? "full" : args.includes("--ci") ? "ci" : "quick",
    json: args.includes("--json"),
    skipTests: args.includes("--skip-tests"),
    skipBuild: args.includes("--skip-build"),
    baseUrl: args.find((a) => a.startsWith("--url="))?.slice(6),
  };

  const report = await runHarness(options);

  if (options.json) {
    const outPath = path.join(process.cwd(), "harness-report.json");
    fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
    console.log(`Wrote ${outPath}`);
  } else {
    console.log(formatHarnessReport(report));
  }

  process.exit(report.exitCode);
}

main().catch((err) => {
  console.error("[harness] fatal:", err);
  process.exit(1);
});
