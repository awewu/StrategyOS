import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { serializeAuditCsv } from "./export";
import type { UsageLogRecord } from "./types";

const row: UsageLogRecord = {
  id: "r1",
  userEmail: "ceo@example.com",
  action: "fpa_view",
  resource: "/finance?tab=capital",
  ip: "10.0.0.1",
  prevHash: "a".repeat(64),
  hash: "b".repeat(64),
  createdAt: new Date("2026-06-24T10:00:00.000Z"),
};

describe("serializeAuditCsv", () => {
  it("emits a header row plus one line per record", () => {
    const csv = serializeAuditCsv([row]);
    const lines = csv.split("\r\n");
    assert.equal(lines.length, 2);
    assert.match(lines[0], /^createdAt,userEmail,action,resource,ip,userAgent,prevHash,hash$/);
    assert.ok(lines[1].includes("ceo@example.com"));
    assert.ok(lines[1].includes("2026-06-24T10:00:00.000Z"));
  });

  it("quotes and escapes values containing commas or quotes", () => {
    const csv = serializeAuditCsv([
      { ...row, resource: 'a,b "c"' },
    ]);
    const line = csv.split("\r\n")[1];
    assert.ok(line.includes('"a,b ""c"""'));
  });

  it("renders an empty body for no rows", () => {
    const csv = serializeAuditCsv([]);
    assert.equal(csv.split("\r\n").length, 1);
  });
});
