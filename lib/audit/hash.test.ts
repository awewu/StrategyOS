import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { GENESIS_HASH, canonicalMetadata, computeLogHash } from "./hash";

const base = {
  prevHash: GENESIS_HASH,
  createdAt: new Date("2026-06-24T10:00:00.000Z"),
  userEmail: "ceo@example.com",
  action: "snapshot_freeze",
  resource: "snapshot:2026-FY",
  metadata: { period: "2026-FY", brand: "A" },
  ip: "10.0.0.1",
};

describe("audit hash", () => {
  it("is deterministic for identical input", () => {
    assert.equal(computeLogHash(base), computeLogHash({ ...base }));
  });

  it("is independent of metadata key order", () => {
    const a = computeLogHash({ ...base, metadata: { period: "2026-FY", brand: "A" } });
    const b = computeLogHash({ ...base, metadata: { brand: "A", period: "2026-FY" } });
    assert.equal(a, b);
  });

  it("changes when any field is tampered", () => {
    const original = computeLogHash(base);
    assert.notEqual(original, computeLogHash({ ...base, action: "role_switch" }));
    assert.notEqual(original, computeLogHash({ ...base, resource: "snapshot:2025-FY" }));
    assert.notEqual(original, computeLogHash({ ...base, metadata: { period: "2025-FY" } }));
    assert.notEqual(original, computeLogHash({ ...base, prevHash: "deadbeef" }));
  });

  it("produces a 64-char hex digest", () => {
    assert.match(computeLogHash(base), /^[0-9a-f]{64}$/);
  });

  it("canonicalizes null/empty metadata", () => {
    assert.equal(canonicalMetadata(null), "null");
    assert.equal(canonicalMetadata(undefined), "null");
  });
});
