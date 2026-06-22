#!/usr/bin/env npx tsx
/**
 * Go-live preflight: env validation, DB connectivity, plan sanity, optional HTTP health.
 *
 * Usage:
 *   npm run preflight
 *   npm run preflight -- --http
 *   STRATOS_BASE_URL=https://stratos.example.com npm run preflight -- --http
 */
import fs from "node:fs";
import path from "node:path";
import { getCapabilityStatus } from "../lib/capabilities";
import {
  DEFAULT_GROUP_ORG_UNIT_ID,
  DEFAULT_HORIZON_END,
  DEFAULT_HORIZON_START,
} from "../lib/data/strategic-plan-data";
import { dbAvailable, prisma } from "../lib/db";
import { collectProductionEnvIssues } from "../lib/env/validate";

const ROOT = process.cwd();
const ENV_FILES = [".env", ".env.local"];

function loadEnvFiles() {
  for (const name of ENV_FILES) {
    const filePath = path.join(ROOT, name);
    if (!fs.existsSync(filePath)) continue;
    const content = fs.readFileSync(filePath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    http: args.includes("--http"),
    strict: args.includes("--strict"),
  };
}

function mark(ok: boolean) {
  return ok ? "✓" : "✗";
}

async function checkHttpHealth(baseUrl: string): Promise<{ ok: boolean; detail: string }> {
  const url = `${baseUrl.replace(/\/$/, "")}/api/health?format=json`;
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      return { ok: false, detail: `HTTP ${res.status} from ${url}` };
    }
    const body = (await res.json()) as { status?: string; dataSource?: string };
    const ok = body.status === "ok" && body.dataSource === "database";
    return {
      ok,
      detail: ok
        ? `status=${body.status}, dataSource=${body.dataSource}`
        : `degraded: status=${body.status}, dataSource=${body.dataSource}`,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, detail: `fetch failed: ${msg}` };
  }
}

async function main() {
  loadEnvFiles();
  const { http, strict } = parseArgs();

  console.log("\n── StratOS production preflight ──\n");

  const env = collectProductionEnvIssues();
  const capabilities = await getCapabilityStatus();
  const dbOk = await dbAvailable();

  console.log("Environment:");
  for (const e of env.errors) console.log(`  ${mark(false)} ${e}`);
  if (env.errors.length === 0) console.log(`  ${mark(true)} Required production env present`);
  for (const w of env.warnings) console.log(`  ○ ${w}`);

  console.log("\nDatabase:");
  console.log(`  ${mark(capabilities.db.configured)} DATABASE_URL set`);
  console.log(`  ${mark(dbOk)} PostgreSQL reachable + schema probe`);

  let planOk = false;
  let planDetail = "skipped (no DB)";
  if (dbOk) {
    const orgUnitId = process.env.ORG_UNIT_ID?.trim() || DEFAULT_GROUP_ORG_UNIT_ID;
    const horizonStart = Number(process.env.HORIZON_START ?? DEFAULT_HORIZON_START);
    const horizonEnd = Number(process.env.HORIZON_END ?? DEFAULT_HORIZON_END);

    const plan = await prisma.strategicPlan.findFirst({
      where: { orgUnitId, horizonStart, horizonEnd },
      include: {
        objectives: { include: { keyResults: true } },
        orgUnit: { select: { name: true } },
      },
    });

    if (plan) {
      const krCount = plan.objectives.reduce((n, o) => n + o.keyResults.length, 0);
      planOk = plan.objectives.length > 0;
      planDetail = `${plan.orgUnit.name} ${horizonStart}-${horizonEnd}: ${plan.objectives.length} obj / ${krCount} KR (${plan.status})`;
    } else {
      planDetail = `No plan for ${orgUnitId} ${horizonStart}-${horizonEnd}`;
    }
  }

  console.log("\nStrategic plan:");
  console.log(`  ${mark(planOk)} ${planDetail}`);

  console.log("\nCapabilities:");
  console.log(`  ${mark(capabilities.workos.configured)} WorkOS SSO`);
  console.log(`  ${mark(capabilities.llm.configured)} LLM (optional)`);
  console.log(`  ${mark(capabilities.fonts.available)} Chinese PDF fonts`);

  const port = process.env.PORT ?? "3003";
  const baseUrl =
    process.env.STRATOS_BASE_URL?.trim() ??
    process.env.STRATOS_PUBLIC_URL?.trim() ??
    `http://127.0.0.1:${port}`;

  let httpOk = true;
  if (http) {
    console.log("\nHTTP health:");
    const health = await checkHttpHealth(baseUrl);
    httpOk = health.ok;
    console.log(`  ${mark(health.ok)} GET ${baseUrl}/api/health — ${health.detail}`);
  } else {
    console.log("\nHTTP health: skipped (pass --http to probe /api/health)");
  }

  const publicUrl = process.env.STRATOS_PUBLIC_URL?.trim();
  console.log("\nGo-live checklist:");
  console.log(`  ${mark(Boolean(publicUrl))} STRATOS_PUBLIC_URL${publicUrl ? `: ${publicUrl}` : ""}`);
  console.log(
    `  ${mark(Boolean(process.env.WORKOS_REDIRECT_URI?.trim()))} WORKOS_REDIRECT_URI matches Dashboard`,
  );
  console.log(`  ${mark(Boolean(process.env.WORKOS_WEBHOOK_SECRET?.trim()))} WORKOS_WEBHOOK_SECRET for Directory Sync`);

  const blocking =
    env.errors.length > 0 ||
    !dbOk ||
    (strict && !planOk) ||
    (http && !httpOk);

  console.log(blocking ? "\n✗ Preflight FAILED — fix items above before go-live\n" : "\n✓ Preflight passed\n");

  await prisma.$disconnect();
  process.exit(blocking ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
