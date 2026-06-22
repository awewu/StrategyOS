import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getMemoryLogs, logUsageEvent } from "./log-event";
import { verifyChainSlice } from "./verify-chain";

describe("log-event", () => {
  it("stores events in memory when DB unavailable", async () => {
    const before = getMemoryLogs(100).length;
    const record = await logUsageEvent({
      action: "login",
      resource: "test@example.com",
      userEmail: "test@example.com",
      userId: "test-id",
      metadata: { test: true },
    });
    assert.equal(record.action, "login");
    assert.equal(record.userEmail, "test@example.com");
    const after = getMemoryLogs(100);
    assert.ok(after.length >= before + 1);
    assert.equal(after[0]?.id, record.id);
  });

  it("links sequential events into a verifiable hash chain", async () => {
    const r1 = await logUsageEvent({ action: "role_switch", resource: "a", userEmail: "a@x.com" });
    const r2 = await logUsageEvent({ action: "role_switch", resource: "b", userEmail: "b@x.com" });
    assert.ok(r1.hash && r2.hash && r2.prevHash);
    assert.equal(r2.prevHash, r1.hash);
    assert.equal(verifyChainSlice([r1, r2], "memory").ok, true);
  });
});
