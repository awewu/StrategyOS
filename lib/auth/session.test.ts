import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { decodeSessionToken, encodeSession } from "@/lib/auth/session";
import type { SessionPayload } from "@/lib/auth/config";

const payload: SessionPayload = {
  userId: "u1",
  email: "ceo@rheem.cn",
  name: "Test",
  role: "ceo",
};

const saved: Record<string, string | undefined> = {};

describe("session signing", () => {
  beforeEach(() => {
    saved.STRATOS_SESSION_SECRET = process.env.STRATOS_SESSION_SECRET;
  });

  afterEach(() => {
    if (saved.STRATOS_SESSION_SECRET === undefined) delete process.env.STRATOS_SESSION_SECRET;
    else process.env.STRATOS_SESSION_SECRET = saved.STRATOS_SESSION_SECRET;
  });

  it("round-trips unsigned in dev (no secret)", () => {
    delete process.env.STRATOS_SESSION_SECRET;
    const token = encodeSession(payload);
    assert.equal(decodeSessionToken(token)?.email, payload.email);
  });

  it("round-trips signed with secret", () => {
    process.env.STRATOS_SESSION_SECRET = "test-secret-at-least-32-characters-long";
    const token = encodeSession(payload);
    assert.ok(token.includes("."));
    assert.equal(decodeSessionToken(token)?.role, "ceo");
  });

  it("rejects tampered signed token", () => {
    process.env.STRATOS_SESSION_SECRET = "test-secret-at-least-32-characters-long";
    const token = encodeSession(payload);
    const tampered = `${token.slice(0, -4)}xxxx`;
    assert.equal(decodeSessionToken(tampered), null);
  });

  it("rejects unsigned token when secret required", () => {
    process.env.STRATOS_SESSION_SECRET = "test-secret-at-least-32-characters-long";
    delete process.env.STRATOS_SESSION_SECRET;
    process.env.STRATOS_SESSION_SECRET = "test-secret-at-least-32-characters-long";
    const unsigned = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
    assert.equal(decodeSessionToken(unsigned), null);
  });
});
