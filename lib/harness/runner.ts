import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { getCapabilityStatus } from "@/lib/capabilities";
import { dbAvailable, prisma } from "@/lib/db";
import { chineseFontAvailable } from "@/lib/pdf/fonts";
import {
  EXPECTED_APIS,
  EXPECTED_PAGES,
  MIN_SEED_COUNTS,
  REQUIRED_FILES,
} from "@/lib/harness/manifest";
import type { HarnessCheck, HarnessOptions, HarnessReport } from "@/lib/harness/types";

const ROOT = process.cwd();

function pageToFile(route: string): string {
  if (route === "/") return "app/page.tsx";
  if (route === "/print/panorama") return "app/print/panorama/page.tsx";
  if (route === "/brand") return "app/brand/page.tsx";
  if (route === "/login") return "app/login/page.tsx";
  if (route.startsWith("/admin/")) {
    return `app/(dashboard)${route}/page.tsx`;
  }
  return `app/(dashboard)${route}/page.tsx`;
}

function apiToFile(route: string): string {
  return `app${route}/route.ts`;
}

async function timed(
  id: string,
  group: string,
  name: string,
  fn: () => Promise<{ status: HarnessCheck["status"]; message: string; meta?: Record<string, unknown> }>
): Promise<HarnessCheck> {
  const start = performance.now();
  try {
    const result = await fn();
    return {
      id,
      group,
      name,
      status: result.status,
      message: result.message,
      durationMs: Math.round(performance.now() - start),
      meta: result.meta,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      id,
      group,
      name,
      status: "fail",
      message: msg,
      durationMs: Math.round(performance.now() - start),
    };
  }
}

function syncTimed(
  id: string,
  group: string,
  name: string,
  fn: () => { status: HarnessCheck["status"]; message: string; meta?: Record<string, unknown> }
): HarnessCheck {
  const start = performance.now();
  try {
    const result = fn();
    return {
      id,
      group,
      name,
      status: result.status,
      message: result.message,
      durationMs: Math.round(performance.now() - start),
      meta: result.meta,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      id,
      group,
      name,
      status: "fail",
      message: msg,
      durationMs: Math.round(performance.now() - start),
    };
  }
}

async function checkCapabilities(): Promise<HarnessCheck> {
  return timed("capabilities", "env", "Runtime capabilities", async () => {
    const cap = await getCapabilityStatus();
    const parts = [
      `mode=${cap.mode}`,
      `db=${cap.db.reachable ? "ok" : cap.db.configured ? "down" : "unset"}`,
      `fonts=${cap.fonts.available ? "ok" : "fallback"}`,
      `llm=${cap.llm.configured ? "ok" : "rules"}`,
      `workos=${cap.workos.configured ? "ok" : "demo"}`,
    ];
    return {
      status: cap.mode === "full" ? "pass" : "warn",
      message: parts.join(" · "),
      meta: cap as unknown as Record<string, unknown>,
    };
  });
}

async function checkDatabase(): Promise<HarnessCheck> {
  return timed("database", "data", "Database connectivity & seed", async () => {
    if (!(await dbAvailable())) {
      return { status: "warn", message: "DATABASE_URL unset or unreachable — demo fallback active" };
    }

    const [users, strategicDiagnosis, investmentCase, healthAssertion] = await Promise.all([
      prisma.user.count(),
      prisma.strategicDiagnosis.count(),
      prisma.investmentCase.count(),
      prisma.healthAssertion.count({ where: { active: true } }),
    ]);

    const counts = { users, strategicDiagnosis, investmentCase, healthAssertion };
    const shortfalls = Object.entries(MIN_SEED_COUNTS)
      .filter(([k, min]) => (counts[k as keyof typeof counts] ?? 0) < min)
      .map(([k, min]) => `${k}<${min}`);

    if (shortfalls.length) {
      return {
        status: "warn",
        message: `Connected but seed incomplete: ${shortfalls.join(", ")} — run npm run db:seed`,
        meta: counts,
      };
    }

    return { status: "pass", message: `Connected · seed OK (${users} users)`, meta: counts };
  });
}

function checkFonts(): HarnessCheck {
  return syncTimed("fonts", "assets", "Chinese PDF font", () => {
    const otf = path.join(ROOT, "public/fonts/NotoSansSC-Regular.otf");
    if (!chineseFontAvailable()) {
      return { status: "warn", message: "NotoSansSC missing — run npm run fonts:fetch" };
    }
    const sizeMb = (fs.statSync(otf).size / (1024 * 1024)).toFixed(1);
    return { status: "pass", message: `NotoSansSC-Regular.otf (${sizeMb} MB)` };
  });
}

function checkRequiredFiles(): HarnessCheck {
  return syncTimed("files", "structure", "Required project files", () => {
    const missing = REQUIRED_FILES.filter((f) => !fs.existsSync(path.join(ROOT, f)));
    if (missing.length) {
      return { status: "fail", message: `Missing: ${missing.join(", ")}`, meta: { missing } };
    }
    return { status: "pass", message: `${REQUIRED_FILES.length} required files present` };
  });
}

function checkRouteManifest(): HarnessCheck {
  return syncTimed("routes", "structure", "Page & API manifest", () => {
    const missingPages = EXPECTED_PAGES.filter((r) => !fs.existsSync(path.join(ROOT, pageToFile(r))));
    const missingApis = EXPECTED_APIS.filter((r) => !fs.existsSync(path.join(ROOT, apiToFile(r))));

    if (missingPages.length || missingApis.length) {
      return {
        status: "fail",
        message: `Drift detected — pages: ${missingPages.length}, apis: ${missingApis.length}`,
        meta: { missingPages, missingApis },
      };
    }
    return {
      status: "pass",
      message: `${EXPECTED_PAGES.length} pages · ${EXPECTED_APIS.length} APIs`,
    };
  });
}


const SCHEMA_CRITICAL_COLUMNS: { table: string; column: string }[] = [
  { table: "users", column: "org_unit_id" },
  { table: "users", column: "project_code" },
  { table: "strategy_mandates", column: "linked_project_code" },
  { table: "org_units", column: "level" },
];

async function checkSchemaSync(): Promise<HarnessCheck> {
  return timed("schema-sync", "data", "Schema ↔ DB column sync", async () => {
    try {
      execSync("npx prisma validate", { cwd: ROOT, stdio: "pipe", encoding: "utf8" });
    } catch (err) {
      const out =
        err && typeof err === "object" && "stderr" in err
          ? String((err as { stderr?: string }).stderr ?? "")
          : "invalid schema";
      return { status: "fail", message: "prisma validate failed", meta: { output: out.slice(-400) } };
    }

    if (!(await dbAvailable())) {
      return { status: "warn", message: "DB unreachable — validated schema only (no column probe)" };
    }

    const rows = await prisma.$queryRaw<{ table_name: string; column_name: string }[]>`
      SELECT table_name, column_name FROM information_schema.columns
      WHERE table_schema = 'public'
    `;
    const present = new Set(rows.map((r) => `${r.table_name}.${r.column_name}`));
    const missing = SCHEMA_CRITICAL_COLUMNS.filter(
      (c) => !present.has(`${c.table}.${c.column}`),
    );

    if (missing.length) {
      return {
        status: "fail",
        message: `Missing columns: ${missing.map((m) => `${m.table}.${m.column}`).join(", ")} — run npx prisma db push`,
        meta: { missing },
      };
    }

    try {
      execSync(
        "npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-schema-datasource prisma/schema.prisma",
        { cwd: ROOT, stdio: "pipe", encoding: "utf8" },
      );
    } catch (err) {
      const out =
        err && typeof err === "object" && "stdout" in err
          ? String((err as { stdout?: string }).stdout ?? "")
          : "schema drift";
      if (!out.includes("No difference detected")) {
        return { status: "fail", message: "Schema drift vs database", meta: { output: out.slice(-600) } };
      }
    }

    return { status: "pass", message: `${SCHEMA_CRITICAL_COLUMNS.length} critical columns present · schema matches DB` };
  });
}

function checkPrismaClient(): HarnessCheck {
  return syncTimed("prisma", "data", "Prisma client generated", () => {
    const clientPath = path.join(ROOT, "node_modules/.prisma/client/index.js");
    if (!fs.existsSync(clientPath)) {
      return { status: "fail", message: "Run npm run db:generate" };
    }
    return { status: "pass", message: "Prisma client present" };
  });
}

function checkEnvFile(): HarnessCheck {
  return syncTimed("env", "env", ".env configuration", () => {
    const envPath = path.join(ROOT, ".env");
    if (!fs.existsSync(envPath)) {
      return { status: "warn", message: "No .env — run npm run setup" };
    }
    const hasDb = Boolean(process.env.DATABASE_URL?.trim());
    return {
      status: hasDb ? "pass" : "warn",
      message: hasDb ? "DATABASE_URL set" : "DATABASE_URL missing in .env",
    };
  });
}

function runUnitTests(): HarnessCheck {
  return syncTimed("unit-tests", "test", "Unit test suite", () => {
    try {
      execSync(
        "node --import tsx --test lib/stratos/*.test.ts lib/audit/*.test.ts lib/panorama/*.test.ts lib/harness/*.test.ts",
        { cwd: ROOT, stdio: "pipe", encoding: "utf8" }
      );
      return { status: "pass", message: "All unit tests passed" };
    } catch (err) {
      const out =
        err && typeof err === "object" && "stdout" in err
          ? String((err as { stdout?: string }).stdout ?? "")
          : "";
      return { status: "fail", message: "Unit tests failed", meta: { output: out.slice(-800) } };
    }
  });
}

function runBuild(): HarnessCheck {
  return syncTimed("build", "build", "Production build", () => {
    try {
      execSync("npm run build", { cwd: ROOT, stdio: "pipe", encoding: "utf8", env: process.env });
      return { status: "pass", message: "next build succeeded" };
    } catch (err) {
      const out =
        err && typeof err === "object" && "stderr" in err
          ? String((err as { stderr?: string }).stderr ?? "")
          : "";
      return { status: "fail", message: "Build failed", meta: { output: out.slice(-800) } };
    }
  });
}

function runLint(): HarnessCheck {
  return syncTimed("lint", "lint", "ESLint", () => {
    try {
      execSync("npm run lint -- --max-warnings 0", { cwd: ROOT, stdio: "pipe", encoding: "utf8" });
      return { status: "pass", message: "No lint errors" };
    } catch (err) {
      const out =
        err && typeof err === "object" && "stdout" in err
          ? String((err as { stdout?: string }).stdout ?? "")
          : "";
      return { status: "warn", message: "Lint issues found", meta: { output: out.slice(-600) } };
    }
  });
}

async function checkHttpSmoke(baseUrl: string): Promise<HarnessCheck> {
  return timed("http-smoke", "runtime", "HTTP API smoke", async () => {
    const endpoints = [
      { path: "/api/health", expect: (b: Record<string, unknown>) => b.status === "ok" },
      { path: "/api/harness", expect: (b: Record<string, unknown>) => b.summary !== undefined },
      { path: "/api/fpa/capital-summary", expect: (b: Record<string, unknown>) => "summary" in b },
    ];

    const failures: string[] = [];
    for (const ep of endpoints) {
      const res = await fetch(`${baseUrl}${ep.path}`, {
        signal: AbortSignal.timeout(8000),
        headers: { accept: "application/json" },
      });
      if (!res.ok) {
        failures.push(`${ep.path} → ${res.status}`);
        continue;
      }
      const body = (await res.json()) as Record<string, unknown>;
      if (!ep.expect(body)) failures.push(`${ep.path} → bad body`);
    }

    if (failures.length) {
      return { status: "fail", message: failures.join("; "), meta: { baseUrl } };
    }
    return { status: "pass", message: `${endpoints.length} endpoints OK @ ${baseUrl}` };
  });
}

function summarize(checks: HarnessCheck[]): HarnessReport["summary"] {
  const summary = { pass: 0, warn: 0, fail: 0, skip: 0, total: checks.length };
  for (const c of checks) summary[c.status]++;
  return summary;
}

function exitCode(summary: HarnessReport["summary"]): number {
  if (summary.fail > 0) return 1;
  return 0;
}

export function formatHarnessReport(report: HarnessReport): string {
  const lines = [
    "",
    "╔══════════════════════════════════════╗",
    "║       StratOS Harness Report         ║",
    "╚══════════════════════════════════════╝",
    `  profile: ${report.profile}  ·  ${report.timestamp}`,
    "",
    `  ✓ pass ${report.summary.pass}   ⚠ warn ${report.summary.warn}   ✗ fail ${report.summary.fail}   ○ skip ${report.summary.skip}`,
    "",
  ];

  let lastGroup = "";
  for (const c of report.checks) {
    if (c.group !== lastGroup) {
      lines.push(`── ${c.group} ──`);
      lastGroup = c.group;
    }
    const icon = c.status === "pass" ? "✓" : c.status === "warn" ? "⚠" : c.status === "fail" ? "✗" : "○";
    lines.push(`  ${icon} [${c.id}] ${c.name}: ${c.message} (${c.durationMs}ms)`);
  }
  lines.push("");
  lines.push(report.exitCode === 0 ? "Harness: PASS" : "Harness: FAIL");
  lines.push("");
  return lines.join("\n");
}

/** Runtime checks only (safe inside Next.js API route — no subprocess) */
export async function runRuntimeHarness(): Promise<HarnessReport> {
  const checks = await Promise.all([
    checkCapabilities(),
    checkSchemaSync(),
    checkDatabase(),
    Promise.resolve(checkFonts()),
    Promise.resolve(checkEnvFile()),
    Promise.resolve(checkPrismaClient()),
  ]);

  const summary = summarize(checks);
  return {
    timestamp: new Date().toISOString(),
    profile: "quick",
    exitCode: exitCode(summary),
    summary,
    checks,
  };
}

/** Full CLI harness — may spawn test/build subprocesses */
export async function runHarness(options: HarnessOptions = {}): Promise<HarnessReport> {
  const profile = options.profile ?? "quick";
  const checks: HarnessCheck[] = [];

  checks.push(checkEnvFile());
  checks.push(await checkCapabilities());
  checks.push(checkFonts());
  checks.push(checkRequiredFiles());
  checks.push(checkRouteManifest());
  checks.push(checkPrismaClient());
  checks.push(await checkSchemaSync());
  checks.push(await checkDatabase());

  if (!options.skipTests) {
    checks.push(runUnitTests());
  }

  if (profile === "full" || profile === "ci") {
    checks.push(runLint());
  }

  if (profile === "full" && !options.skipBuild) {
    checks.push(runBuild());
  }

  const baseUrl =
    options.baseUrl ??
    process.env.STRATOS_HARNESS_BASE_URL ??
    (profile === "full" ? "http://127.0.0.1:3003" : undefined);

  if (baseUrl) {
    try {
      const probe = await fetch(`${baseUrl}/api/health`, { signal: AbortSignal.timeout(2000) });
      if (probe.ok) {
        checks.push(await checkHttpSmoke(baseUrl));
      } else {
        checks.push({
          id: "http-smoke",
          group: "runtime",
          name: "HTTP API smoke",
          status: "skip",
          message: `Server at ${baseUrl} not ready`,
          durationMs: 0,
        });
      }
    } catch {
      checks.push({
        id: "http-smoke",
        group: "runtime",
        name: "HTTP API smoke",
        status: "skip",
        message: `No dev server at ${baseUrl} — start npm run dev or set STRATOS_HARNESS_BASE_URL`,
        durationMs: 0,
      });
    }
  }

  const summary = summarize(checks);
  return {
    timestamp: new Date().toISOString(),
    profile,
    exitCode: exitCode(summary),
    summary,
    checks,
  };
}
