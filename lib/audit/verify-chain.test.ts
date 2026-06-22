import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { GENESIS_HASH, computeLogHash } from "./hash";
import { verifyChainSlice } from "./verify-chain";
import type { UsageLogRecord } from "./types";

function buildChain(n: number): UsageLogRecord[] {
  const rows: UsageLogRecord[] = [];
  let prevHash = GENESIS_HASH;
  for (let i = 0; i < n; i++) {
    const createdAt = new Date(Date.UTC(2026, 5, 24, 10, 0, i));
    const userEmail = `user${i}@example.com`;
    const action = "login";
    const resource = `session:${i}`;
    const metadata = { i };
    const hash = computeLogHash({ prevHash, createdAt, userEmail, action, resource, metadata, ip: null });
    rows.push({ id: `row-${i}`, userEmail, action, resource, metadata, prevHash, hash, createdAt });
    prevHash = hash;
  }
  return rows;
}

describe("verifyChainSlice", () => {
  it("passes for an untampered chain", () => {
    const result = verifyChainSlice(buildChain(5), "database");
    assert.equal(result.ok, true);
    assert.equal(result.checked, 5);
  });

  it("reports empty for no rows", () => {
    const result = verifyChainSlice([], "database");
    assert.equal(result.ok, true);
    assert.equal(result.source, "empty");
  });

  it("detects content tampering", () => {
    const rows = buildChain(5);
    rows[2] = { ...rows[2], resource: "session:HACKED" };
    const result = verifyChainSlice(rows, "database");
    assert.equal(result.ok, false);
    assert.equal(result.break?.reason, "content-tampered");
    assert.equal(result.break?.index, 2);
  });

  it("detects a deleted/reordered row via broken link", () => {
    const rows = buildChain(5);
    rows.splice(2, 1); // delete a row, leaving a dangling prevHash link
    const result = verifyChainSlice(rows, "database");
    assert.equal(result.ok, false);
    assert.equal(result.break?.reason, "link-broken");
  });

  it("flags rows missing hash columns (pre-migration data)", () => {
    const rows = buildChain(2);
    rows[1] = { ...rows[1], hash: undefined };
    const result = verifyChainSlice(rows, "database");
    assert.equal(result.ok, false);
    assert.equal(result.break?.reason, "missing-hash");
  });
});
