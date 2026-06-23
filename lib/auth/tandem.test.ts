import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  decodeTandemState,
  encodeTandemState,
  mapTandemRole,
  type TandemAuthState,
} from "@/lib/auth/tandem";

describe("tandem auth state", () => {
  const state: TandemAuthState = {
    state: "s-123",
    nonce: "n-456",
    verifier: "v-789",
    next: "/command",
  };

  it("round-trips encode/decode", () => {
    const decoded = decodeTandemState(encodeTandemState(state));
    assert.deepEqual(decoded, state);
  });

  it("returns null for missing/garbage cookie", () => {
    assert.equal(decodeTandemState(undefined), null);
    assert.equal(decodeTandemState("not-base64url-json"), null);
  });

  it("forces relative next path", () => {
    const decoded = decodeTandemState(
      encodeTandemState({ ...state, next: "https://evil.example.com" }),
    );
    assert.equal(decoded?.next, "/command");
  });

  it("rejects state without verifier", () => {
    const bad = Buffer.from(JSON.stringify({ state: "x" }), "utf8").toString("base64url");
    assert.equal(decodeTandemState(bad), null);
  });
});

describe("tandem role mapping", () => {
  it("maps highest-privilege role first", () => {
    assert.equal(mapTandemRole(["employee", "admin"]), "ceo");
    assert.equal(mapTandemRole(["owner"]), "ceo");
    assert.equal(mapTandemRole(["finance"]), "cfo");
    assert.equal(mapTandemRole(["manager"]), "vp");
    assert.equal(mapTandemRole(["steward"]), "system_head");
    assert.equal(mapTandemRole(["champion"]), "system_head");
    assert.equal(mapTandemRole(["employee"]), "staff");
  });

  it("defaults to observer for unknown/empty roles", () => {
    assert.equal(mapTandemRole(undefined), "observer");
    assert.equal(mapTandemRole([]), "observer");
    assert.equal(mapTandemRole(["something-else"]), "observer");
  });

  it("is case-insensitive", () => {
    assert.equal(mapTandemRole(["ADMIN"]), "ceo");
  });
});
