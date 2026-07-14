import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { persistDiffsBetweenSnapshots } from "./persist-diff";
import { snapshotFY25, snapshotFY26 } from "../stratos-demo-data";

describe("persist-diff", () => {
  it("computes diffs without DB", async () => {
    const r = await persistDiffsBetweenSnapshots("a", "b", snapshotFY25, snapshotFY26);
    assert.ok(r.count > 0);
  });
});
