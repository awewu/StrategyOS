#!/usr/bin/env npx tsx
/**
 * Validates WorkOS + StratOS auth env and prints redirect URI checklist.
 * Run: npm run workos:check
 */
import fs from "fs";
import path from "path";

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

function check(name: string, value: string | undefined, required = false): boolean {
  const ok = Boolean(value?.trim());
  const mark = ok ? "✓" : required ? "✗" : "○";
  const suffix = ok ? "" : required ? " (required)" : " (optional)";
  console.log(`  ${mark} ${name}${suffix}`);
  return ok;
}

loadEnvFiles();

const port = process.env.PORT ?? "3003";
const localOrigin = `http://localhost:${port}`;
const redirectUri =
  process.env.WORKOS_REDIRECT_URI?.trim() ?? `${localOrigin}/api/auth/callback`;

console.log("\n── StratOS WorkOS setup check ──\n");

console.log("Auth mode:");
const requireAuth = process.env.STRATOS_REQUIRE_AUTH === "1";
const sessionSecret = process.env.STRATOS_SESSION_SECRET?.trim();
console.log(`  ${requireAuth ? "✓" : "○"} STRATOS_REQUIRE_AUTH=1${requireAuth ? "" : " (recommended for production)"}`);
console.log(
  `  ${sessionSecret && sessionSecret.length >= 32 ? "✓" : "○"} STRATOS_SESSION_SECRET (min 32 chars)`,
);

console.log("\nWorkOS credentials:");
const hasClientId = check("WORKOS_CLIENT_ID", process.env.WORKOS_CLIENT_ID, requireAuth);
const hasApiKey = check("WORKOS_API_KEY", process.env.WORKOS_API_KEY, requireAuth);
check("WORKOS_ORGANIZATION_ID", process.env.WORKOS_ORGANIZATION_ID);
check("WORKOS_WEBHOOK_SECRET", process.env.WORKOS_WEBHOOK_SECRET);

console.log("\nRedirect URI checklist (WorkOS Dashboard → Redirects):");
console.log(`  • Local dev:  ${localOrigin}/api/auth/callback`);
console.log(`  • Configured: ${redirectUri}`);
if (redirectUri !== `${localOrigin}/api/auth/callback`) {
  console.log("  ⚠ WORKOS_REDIRECT_URI differs from default local URI — ensure Dashboard matches.");
}

console.log("\nWebhook checklist (WorkOS Dashboard → Webhooks):");
const prodDomain = process.env.STRATOS_PUBLIC_URL ?? "https://<your-production-domain>";
console.log(`  • URL:    ${prodDomain}/api/auth/workos/webhook`);
console.log("  • Events: dsync.user.created, dsync.user.updated, dsync.user.deleted");
console.log("  • Secret: copy whsec_… into WORKOS_WEBHOOK_SECRET");

console.log("\nRoutes (already implemented):");
console.log("  • GET  /api/auth/workos          → start SSO");
console.log("  • GET  /api/auth/callback        → OAuth callback");
console.log("  • POST /api/auth/workos/webhook  → Directory Sync");

const workosReady = hasClientId && hasApiKey;
const issues: string[] = [];
if (requireAuth && !sessionSecret) {
  issues.push("STRATOS_SESSION_SECRET missing or too short");
}
if (requireAuth && !workosReady) {
  issues.push("STRATOS_REQUIRE_AUTH=1 but WorkOS not configured — demo login only");
}
if (requireAuth && workosReady) {
  console.log("\n✓ Production auth path: WorkOS SSO + signed sessions");
} else if (workosReady) {
  console.log("\n✓ WorkOS ready — SSO button will appear on /login");
} else {
  console.log("\n○ WorkOS not configured — demo email login on /login");
}

if (issues.length > 0) {
  console.log("\nWarnings:");
  for (const i of issues) console.log(`  ⚠ ${i}`);
}

console.log("");
process.exit(issues.length > 0 && requireAuth && !workosReady ? 1 : 0);
