import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { leadTimeOf, LEAD_TIME_LABEL, SOURCE_LABEL } from "./types";

describe("intel lead-time classification", () => {
  it("recruitment and patent are leading indicators (6–12mo ahead)", () => {
    assert.equal(leadTimeOf("recruitment"), "leading");
    assert.equal(leadTimeOf("patent"), "leading");
  });

  it("financial filings are lagging confirmations", () => {
    assert.equal(leadTimeOf("filing"), "lagging");
  });

  it("product / gtm / brand surfaces are coincident", () => {
    assert.equal(leadTimeOf("official_site"), "coincident");
    assert.equal(leadTimeOf("press"), "coincident");
    assert.equal(leadTimeOf("social"), "coincident");
    assert.equal(leadTimeOf("channel"), "coincident");
  });

  it("every source kind has a label and a defined lead time", () => {
    const kinds = Object.keys(SOURCE_LABEL) as (keyof typeof SOURCE_LABEL)[];
    for (const k of kinds) {
      assert.ok(SOURCE_LABEL[k].length > 0);
      assert.ok(LEAD_TIME_LABEL[leadTimeOf(k)].length > 0);
    }
  });
});
