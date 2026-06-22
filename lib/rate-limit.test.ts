import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { checkRateLimit, resetRateLimitsForTest } from "./rate-limit";

describe("rate-limit", () => {
  beforeEach(() => {
    resetRateLimitsForTest();
  });

  it("allows requests under limit", () => {
    const r1 = checkRateLimit("test-key", 3, 60_000);
    const r2 = checkRateLimit("test-key", 3, 60_000);
    assert.equal(r1.ok, true);
    assert.equal(r2.ok, true);
    assert.equal(r2.remaining, 1);
  });

  it("blocks when limit exceeded", () => {
    checkRateLimit("block-key", 2, 60_000);
    checkRateLimit("block-key", 2, 60_000);
    const r3 = checkRateLimit("block-key", 2, 60_000);
    assert.equal(r3.ok, false);
    assert.ok(r3.retryAfterSec && r3.retryAfterSec > 0);
  });

  it("isolates keys", () => {
    checkRateLimit("a", 1, 60_000);
    const blocked = checkRateLimit("a", 1, 60_000);
    const other = checkRateLimit("b", 1, 60_000);
    assert.equal(blocked.ok, false);
    assert.equal(other.ok, true);
  });
});
