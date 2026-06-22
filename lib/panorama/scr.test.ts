import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildScrSummary, buildTopAlerts, buildImplications, buildDecisionItems, buildIssueTree } from "./scr";
import { minimalCommandDeckStub } from "./test-fixtures";

describe("panorama scr", () => {
  const deck = minimalCommandDeckStub();

  it("builds SCR with crux in resolution", () => {
    const scr = buildScrSummary(deck);
    assert.match(scr.resolution, /热泵产品化/);
    assert.ok(scr.complication.includes("Runway"));
  });

  it("caps top alerts at 3", () => {
    const alerts = buildTopAlerts(deck, 3);
    assert.ok(alerts.length <= 3);
    assert.ok(alerts.length >= 1);
  });

  it("builds implications and decisions from deck", () => {
    const implications = buildImplications(deck);
    assert.ok(implications.length >= 1);
    const decisions = buildDecisionItems(deck);
    assert.ok(decisions.some((d: { id: string }) => d.id === "dec-runway"));
    const tree = buildIssueTree(deck);
    assert.equal(tree.length, 3);
  });
});
