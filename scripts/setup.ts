#!/usr/bin/env npx tsx
/**
 * Idempotent StratOS bootstrap: env, fonts, optional Docker Postgres, Prisma, seed.
 * Run: npm run setup
 */
import { execSync, spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { getCapabilityStatus, formatCapabilityReport } from "../lib/capabilities";

const ROOT = process.cwd();
const ENV_EXAMPLE = path.join(ROOT, ".env.example");
const ENV_FILE = path.join(ROOT, ".env");

function log(msg: string) {
  console.log(`[setup] ${msg}`);
}

function run(cmd: string, opts: { env?: NodeJS.ProcessEnv; silent?: boolean } = {}) {
  log(`$ ${cmd}`);
  execSync(cmd, {
    cwd: ROOT,
    stdio: opts.silent ? "pipe" : "inherit",
    env: { ...process.env, ...opts.env },
  });
}

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
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

function hasDocker(): boolean {
  const res = spawnSync("docker", ["info"], { stdio: "ignore" });
  return res.status === 0;
}

function hasCompose(): boolean {
  const res = spawnSync("docker", ["compose", "version"], { stdio: "ignore" });
  return res.status === 0;
}

async function waitForDb(maxAttempts = 40, intervalMs = 1500): Promise<boolean> {
  if (!process.env.DATABASE_URL) return false;

  const { PrismaClient } = await import("@prisma/client");
  const client = new PrismaClient();

  for (let i = 1; i <= maxAttempts; i++) {
    try {
      await client.$queryRaw`SELECT 1`;
      await client.$disconnect();
      log(`Database ready (attempt ${i})`);
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const fatal =
        /denied access|authentication failed|does not exist|ECONNREFUSED/i.test(msg);
      if (fatal && !hasDocker()) {
        log(`Database error (no Docker): ${msg.slice(0, 80)}…`);
        break;
      }
      if (i === maxAttempts) break;
      if (i <= 3 || i % 5 === 0) {
        log(`Waiting for database… (${i}/${maxAttempts})`);
      }
      await new Promise((r) => setTimeout(r, intervalMs));
    }
  }

  await client.$disconnect().catch(() => undefined);
  log("Database not reachable — continuing with demo mode");
  return false;
}

function ensureEnv() {
  if (fs.existsSync(ENV_FILE)) {
    log(".env already exists");
    loadEnvFile(ENV_FILE);
    return;
  }
  if (!fs.existsSync(ENV_EXAMPLE)) {
    throw new Error("Missing .env.example");
  }
  fs.copyFileSync(ENV_EXAMPLE, ENV_FILE);
  log("Created .env from .env.example");
  loadEnvFile(ENV_FILE);
}

function ensureFonts() {
  run("npm run fonts:fetch");
}

function startDocker(skipDocker: boolean) {
  if (skipDocker) {
    log("Skipping Docker (--skip-docker)");
    return;
  }
  if (!hasDocker() || !hasCompose()) {
    log("Docker not available — skip postgres container");
    return;
  }
  run("docker compose up -d");
}

async function setupDatabase() {
  run("npm run db:generate");

  const dbReady = await waitForDb();
  if (!dbReady) return false;

  run("npx prisma db push --accept-data-loss");
  run("npm run db:seed");
  return true;
}

async function main() {
  const args = process.argv.slice(2);
  const skipDocker = args.includes("--skip-docker");
  const fontsOnly = args.includes("--fonts-only");
  const dbOnly = args.includes("--db-only");

  ensureEnv();

  if (fontsOnly) {
    ensureFonts();
    return;
  }

  if (!dbOnly) {
    ensureFonts();
    startDocker(skipDocker);
  }

  await setupDatabase();

  loadEnvFile(ENV_FILE);
  const status = await getCapabilityStatus();
  console.log(formatCapabilityReport(status));

  if (status.mode === "demo") {
    log("Tip: start Postgres (docker compose up -d) and re-run npm run setup");
  }
  if (!status.workos.configured) {
    log("Tip: add WorkOS keys to .env — see docs/SETUP.md");
  }
  if (!status.llm.configured) {
    log("Tip: add OPENAI_API_KEY to .env for LLM report parsing");
  }
}

main().catch((err) => {
  console.error("[setup] failed:", err);
  process.exit(1);
});
