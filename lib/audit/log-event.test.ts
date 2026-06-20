import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getMemoryLogs, logUsageEvent } from "./log-event";

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
});
