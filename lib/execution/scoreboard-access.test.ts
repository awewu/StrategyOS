import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildDerivedScoreboardConfig,
  parseScoreboardConfig,
  resolveScoreboardView,
} from "./scoreboard-access";
import * as demo from "../stratos-demo-data";

describe("scoreboard-access", () => {
  const allKrs = [...demo.leadingKrs, ...demo.laggingKrs];

  it("builds derived config from leading KRs", () => {
    const cfg = buildDerivedScoreboardConfig(demo.leadingKrs);
    assert.deepEqual(cfg.leadingKrIds, demo.leadingKrs.map((k) => k.id));
    assert.equal(cfg.wigObjectiveId, null);
    assert.deepEqual(cfg.laggingKrIds, []);
  });

  it("parses valid scoreboard config", () => {
    const cfg = parseScoreboardConfig({
      wigObjectiveId: "obj-wig",
      leadingKrIds: ["kr-lead-1"],
      laggingKrIds: ["kr-lag-1"],
    });
    assert.equal(cfg.wigObjectiveId, "obj-wig");
    assert.deepEqual(cfg.leadingKrIds, ["kr-lead-1"]);
    assert.deepEqual(cfg.laggingKrIds, ["kr-lag-1"]);
  });

  it("rejects invalid scoreboard config", () => {
    assert.throws(() => parseScoreboardConfig({ leadingKrIds: "bad" }), /格式无效/);
  });

  it("resolves WIG from objective when configured", () => {
    const resolved = resolveScoreboardView(
      {
        wigObjectiveId: "obj-wig",
        leadingKrIds: ["kr-lead-1"],
        laggingKrIds: ["kr-lag-1"],
      },
      {
        diagnosis: demo.diagnosis,
        objectives: demo.objectives,
        allKrs,
        derivedLeadingKrs: demo.leadingKrs,
      },
    );
    assert.equal(resolved.wigLabel, demo.objectives[0]!.title);
    assert.equal(resolved.leadingKrs.length, 1);
    assert.equal(resolved.laggingKrs.length, 1);
  });

  it("falls back to diagnosis crux and derived leading KRs", () => {
    const resolved = resolveScoreboardView(
      { wigObjectiveId: null, leadingKrIds: [], laggingKrIds: [] },
      {
        diagnosis: demo.diagnosis,
        objectives: demo.objectives,
        allKrs,
        derivedLeadingKrs: demo.leadingKrs,
      },
    );
    assert.equal(resolved.wigLabel, demo.diagnosis.crux);
    assert.equal(resolved.leadingKrs.length, demo.leadingKrs.length);
  });
});
