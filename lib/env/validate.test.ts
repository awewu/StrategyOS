import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { collectProductionEnvIssues, shouldValidateEnvOnBoot } from "./validate";

const saved: Record<string, string | undefined> = {};

function setEnv(key: string, value: string | undefined) {
  saved[key] = process.env[key];
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

describe("env validate", () => {
  beforeEach(() => {
    for (const k of [
      "NODE_ENV",
      "DATABASE_URL",
      "STRATOS_REQUIRE_AUTH",
      "STRATOS_SESSION_SECRET",
      "WORKOS_CLIENT_ID",
      "WORKOS_API_KEY",
      "STRATOS_VALIDATE_ENV",
      "STRATOS_SKIP_ENV_VALIDATE",
    ]) {
      saved[k] = process.env[k];
    }
  });

  afterEach(() => {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  });

  it("collectProductionEnvIssues flags missing required vars", () => {
    setEnv("DATABASE_URL", undefined);
    setEnv("STRATOS_REQUIRE_AUTH", undefined);
    setEnv("STRATOS_SESSION_SECRET", undefined);
    const result = collectProductionEnvIssues();
    assert.equal(result.ok, false);
    assert.ok(result.errors.length >= 3);
  });

  it("collectProductionEnvIssues passes with full production env", () => {
    setEnv("DATABASE_URL", "postgresql://localhost/stratos");
    setEnv("STRATOS_REQUIRE_AUTH", "1");
    setEnv("STRATOS_SESSION_SECRET", "x".repeat(32));
    setEnv("WORKOS_CLIENT_ID", "client_test");
    setEnv("WORKOS_API_KEY", "sk_test");
    const result = collectProductionEnvIssues();
    assert.equal(result.ok, true);
    assert.equal(result.errors.length, 0);
  });

  it("shouldValidateEnvOnBoot is true in production", () => {
    setEnv("NODE_ENV", "production");
    setEnv("STRATOS_SKIP_ENV_VALIDATE", undefined);
    assert.equal(shouldValidateEnvOnBoot(), true);
  });

  it("shouldValidateEnvOnBoot respects STRATOS_SKIP_ENV_VALIDATE", () => {
    setEnv("NODE_ENV", "production");
    setEnv("STRATOS_SKIP_ENV_VALIDATE", "1");
    assert.equal(shouldValidateEnvOnBoot(), false);
  });

  it("collectProductionEnvIssues warns when require auth without WorkOS", () => {
    setEnv("DATABASE_URL", "postgresql://localhost/stratos");
    setEnv("STRATOS_REQUIRE_AUTH", "1");
    setEnv("STRATOS_SESSION_SECRET", "x".repeat(32));
    setEnv("WORKOS_CLIENT_ID", undefined);
    setEnv("WORKOS_API_KEY", undefined);
    const result = collectProductionEnvIssues();
    assert.equal(result.ok, true);
    assert.ok(result.warnings.some((w) => w.includes("STRATOS_REQUIRE_AUTH=1")));
  });
});
