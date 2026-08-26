import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeCommitmentSummary, fulfillmentRateColor } from "./commitment-summary";
import type { CommitmentRecord } from "./tension-analysis";

function rec(id: string, status: CommitmentRecord["status"], daysOverdue?: number): CommitmentRecord {
  return { id, owner: "o", department: "d", content: "c", deadline: "2026-06-30", status, daysOverdue };
}

describe("commitment-summary", () => {
  it("computes totals, rate and max overdue", () => {
    const s = computeCommitmentSummary([
      rec("1", "completed"),
      rec("2", "completed"),
      rec("3", "overdue", 21),
      rec("4", "overdue", 7),
      rec("5", "in_progress"),
    ]);
    assert.equal(s.total, 5);
    assert.equal(s.done, 2);
    assert.equal(s.overdue, 2);
    assert.equal(s.inflight, 1);
    assert.equal(s.rate, 40);
    assert.equal(s.maxDaysOverdue, 21);
  });

  it("empty list yields zero rate, not NaN", () => {
    const s = computeCommitmentSummary([]);
    assert.equal(s.total, 0);
    assert.equal(s.rate, 0);
    assert.equal(s.maxDaysOverdue, 0);
  });

  it("rate color thresholds 70/50", () => {
    assert.equal(fulfillmentRateColor(70), "var(--signal-green-text)");
    assert.equal(fulfillmentRateColor(69), "var(--signal-yellow-text)");
    assert.equal(fulfillmentRateColor(50), "var(--signal-yellow-text)");
    assert.equal(fulfillmentRateColor(49), "var(--signal-red-text)");
  });
});
