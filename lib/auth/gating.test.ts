import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { authRequired, demoLoginAllowed, workosConfigured } from "./config";

const KEYS = [
  "STRATOS_REQUIRE_AUTH",
  "WORKOS_CLIENT_ID",
  "WORKOS_API_KEY",
] as const;

const saved: Record<string, string | undefined> = {};

function setEnv(key: string, value: string | undefined) {
  saved[key] = process.env[key];
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

describe("auth gating", () => {
  beforeEach(() => {
    for (const k of KEYS) saved[k] = process.env[k];
  });

  afterEach(() => {
    for (const k of KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  it("demoLoginAllowed when auth not required", () => {
    setEnv("STRATOS_REQUIRE_AUTH", undefined);
    setEnv("WORKOS_CLIENT_ID", "client");
    setEnv("WORKOS_API_KEY", "sk");
    assert.equal(demoLoginAllowed(), true);
  });

  it("demoLoginAllowed when require auth but WorkOS not configured", () => {
    setEnv("STRATOS_REQUIRE_AUTH", "1");
    setEnv("WORKOS_CLIENT_ID", undefined);
    setEnv("WORKOS_API_KEY", undefined);
    assert.equal(workosConfigured(), false);
    assert.equal(demoLoginAllowed(), true);
  });

  it("demoLogin blocked when require auth and WorkOS configured", () => {
    setEnv("STRATOS_REQUIRE_AUTH", "1");
    setEnv("WORKOS_CLIENT_ID", "client_test");
    setEnv("WORKOS_API_KEY", "sk_test");
    assert.equal(authRequired(), true);
    assert.equal(workosConfigured(), true);
    assert.equal(demoLoginAllowed(), false);
  });

  it("workosConfigured requires both client id and api key", () => {
    setEnv("WORKOS_CLIENT_ID", "client");
    setEnv("WORKOS_API_KEY", undefined);
    assert.equal(workosConfigured(), false);
    setEnv("WORKOS_API_KEY", "sk");
    assert.equal(workosConfigured(), true);
  });
});
