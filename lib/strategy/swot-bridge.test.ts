import { test } from "node:test";
import assert from "node:assert/strict";
import {
  planSwotToBoard,
  swotBoardItemCount,
  clampSwotScale,
  normalizeSwotDimension,
} from "./swot-bridge";

test("clampSwotScale bounds to 1..5 with fallback 3", () => {
  assert.equal(clampSwotScale(null), 3);
  assert.equal(clampSwotScale(undefined), 3);
  assert.equal(clampSwotScale(0), 1);
  assert.equal(clampSwotScale(9), 5);
  assert.equal(clampSwotScale(4), 4);
  assert.equal(clampSwotScale(2.6), 3);
});

test("normalizeSwotDimension only accepts valid market dimensions", () => {
  assert.equal(normalizeSwotDimension("product"), "product");
  assert.equal(normalizeSwotDimension("GTM"), "gtm");
  assert.equal(normalizeSwotDimension("finance"), undefined);
  assert.equal(normalizeSwotDimension(null), undefined);
});

test("planSwotToBoard maps quadrants, defaults scales, drops empties", () => {
  const board = planSwotToBoard([
    { quadrant: "strength", content: "V4 平台", weight: 5, intensity: 4, dimension: "product" },
    { quadrant: "weakness", content: "渠道薄弱" },
    { quadrant: "opportunity", content: "  " },
    { quadrant: "threat", content: "竞品降价", weight: 2, intensity: 5 },
  ]);
  assert.equal(swotBoardItemCount(board), 3);
  assert.equal(board.strength.length, 1);
  assert.equal(board.opportunity.length, 0);
  assert.equal(board.strength[0].weight, 5);
  assert.equal(board.strength[0].dimension, "product");
  // weakness had no scores → default 3
  assert.equal(board.weakness[0].weight, 3);
  assert.equal(board.weakness[0].intensity, 3);
});

test("planSwotToBoard sorts each quadrant by weight*intensity desc", () => {
  const board = planSwotToBoard([
    { quadrant: "strength", content: "low", weight: 1, intensity: 2 },
    { quadrant: "strength", content: "high", weight: 5, intensity: 5 },
    { quadrant: "strength", content: "mid", weight: 3, intensity: 3 },
  ]);
  assert.deepEqual(board.strength.map((i) => i.title), ["high", "mid", "low"]);
});
