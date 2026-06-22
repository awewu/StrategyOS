#!/usr/bin/env npx tsx
/**
 * Lightweight HTTP smoke test against a running StratOS instance.
 *
 * Usage:
 *   npm run smoke
 *   STRATOS_BASE_URL=http://localhost:3003 npm run smoke
 */
import fs from "node:fs";
import path from "node:path";
import {
  DEFAULT_GROUP_ORG_UNIT_ID,
  DEFAULT_HORIZON_END,
  DEFAULT_HORIZON_START,
} from "../lib/data/strategic-plan-data";

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

async function getJson(url: string) {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(10_000),
  });
  const text = await res.text();
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    body = text.slice(0, 200);
  }
  return { ok: res.ok, status: res.status, body };
}

async function main() {
  loadEnvFiles();
  const port = process.env.PORT ?? "3003";
  const base = (process.env.STRATOS_BASE_URL ?? `http://127.0.0.1:${port}`).replace(/\/$/, "");
  const orgUnitId = process.env.ORG_UNIT_ID?.trim() || DEFAULT_GROUP_ORG_UNIT_ID;
  const horizonStart = process.env.HORIZON_START ?? String(DEFAULT_HORIZON_START);
  const horizonEnd = process.env.HORIZON_END ?? String(DEFAULT_HORIZON_END);

  console.log(`\n── StratOS smoke @ ${base} ──\n`);

  const health = await getJson(`${base}/api/health?format=json`);
  console.log(`GET /api/health → ${health.status}`);
  console.log(JSON.stringify(health.body, null, 2));

  const planUrl = `${base}/api/strategy/plan?orgUnitId=${encodeURIComponent(orgUnitId)}&horizonStart=${horizonStart}&horizonEnd=${horizonEnd}`;
  const plan = await getJson(planUrl);
  console.log(`\nGET /api/strategy/plan → ${plan.status}`);
  if (plan.ok && plan.body && typeof plan.body === "object" && plan.body !== null) {
    const p = plan.body as { objectives?: unknown[]; status?: string; id?: string };
    console.log(
      JSON.stringify(
        {
          planId: p.id ?? null,
          status: p.status ?? null,
          objectives: Array.isArray(p.objectives) ? p.objectives.length : 0,
        },
        null,
        2,
      ),
    );
  } else {
    console.log(JSON.stringify(plan.body, null, 2));
  }

  const passed = health.ok && plan.ok;
  console.log(passed ? "\n✓ Smoke passed\n" : "\n✗ Smoke failed\n");
  process.exit(passed ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
