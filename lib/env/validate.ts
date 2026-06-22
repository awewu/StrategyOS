/**
 * Production boot validation — fail fast when required env is missing.
 * Dev/test: no-op unless STRATOS_VALIDATE_ENV=1.
 */

export interface EnvValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

const MIN_SESSION_SECRET_LEN = 32;

export function collectProductionEnvIssues(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!process.env.DATABASE_URL?.trim()) {
    errors.push("DATABASE_URL is required in production");
  }

  if (process.env.STRATOS_REQUIRE_AUTH !== "1") {
    errors.push("STRATOS_REQUIRE_AUTH=1 is required in production (~30 users)");
  }

  const secret = process.env.STRATOS_SESSION_SECRET?.trim();
  if (!secret) {
    errors.push("STRATOS_SESSION_SECRET is required in production (min 32 chars)");
  } else if (secret.length < MIN_SESSION_SECRET_LEN) {
    errors.push(`STRATOS_SESSION_SECRET must be at least ${MIN_SESSION_SECRET_LEN} characters`);
  }

  const workosReady = Boolean(
    process.env.WORKOS_CLIENT_ID?.trim() && process.env.WORKOS_API_KEY?.trim(),
  );
  if (!workosReady) {
    warnings.push(
      "STRATOS_REQUIRE_AUTH=1 but WorkOS not configured — only demo email login available (not for production)",
    );
  }

  if (process.env.STRATOS_ALLOW_DEMO_FALLBACK === "1") {
    warnings.push(
      "STRATOS_ALLOW_DEMO_FALLBACK=1: demo fallback is enabled in production — this is an emergency bypass only",
    );
  }

  return { ok: errors.length === 0, errors, warnings };
}

export function shouldValidateEnvOnBoot(): boolean {
  if (process.env.STRATOS_SKIP_ENV_VALIDATE === "1") return false;
  if (process.env.NODE_ENV === "production") return true;
  return process.env.STRATOS_VALIDATE_ENV === "1";
}

/** Throws on invalid production env; logs warnings. */
export function validateProductionEnv(): void {
  if (!shouldValidateEnvOnBoot()) return;

  const result = collectProductionEnvIssues();
  for (const w of result.warnings) {
    console.warn(`[StratOS env] ${w}`);
  }
  if (!result.ok) {
    throw new Error(
      `StratOS production environment invalid:\n${result.errors.map((e) => `  • ${e}`).join("\n")}`,
    );
  }
}
