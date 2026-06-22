import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseCultureHandbookJson } from "./handbook-access";
import { DOCTRINES } from "../constants";
import {
  BEHAVIOR_GUIDELINES,
  CORE_VALUES_INTRO,
  FOUR_SATISFACTION_PILLARS,
} from "./content";

describe("culture handbook-access", () => {
  it("parses valid handbook JSON", () => {
    const handbook = parseCultureHandbookJson({
      doctrines: DOCTRINES.map((d) => ({ ...d })),
      fourSatisfactionPillars: [...FOUR_SATISFACTION_PILLARS],
      coreValuesIntro: {
        headline: CORE_VALUES_INTRO.headline,
        body: CORE_VALUES_INTRO.body,
        principles: [...CORE_VALUES_INTRO.principles],
        decisionTest: CORE_VALUES_INTRO.decisionTest,
      },
      behaviorGuidelines: BEHAVIOR_GUIDELINES.map((g) => ({
        id: g.id,
        title: g.title,
        items: [...g.items],
      })),
    });
    assert.equal(handbook.doctrines.length, 3);
    assert.equal(handbook.fourSatisfactionPillars.length, 4);
    assert.equal(handbook.behaviorGuidelines.length, BEHAVIOR_GUIDELINES.length);
  });

  it("rejects invalid handbook JSON", () => {
    assert.throws(() => parseCultureHandbookJson({ doctrines: [] }), /格式无效/);
  });
});
