import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildPanoramaViewModel, kpiValue } from "./view-model";
import { minimalCommandDeckStub } from "./test-fixtures";

describe("panorama view-model", () => {
  it("builds from minimal deck shape", () => {
    const deck = {
      ...minimalCommandDeckStub(),
      diagnosis: {
        ...minimalCommandDeckStub().diagnosis,
        challengeStatement: "test",
        crux: "crux",
      },
      assertions: [],
    };
    const vm = buildPanoramaViewModel(deck);
    assert.equal(vm.period, "2026-FY");
    assert.match(kpiValue(vm, "runway"), /月/);
    assert.match(kpiValue(vm, "ros"), /%/);
  });
});
