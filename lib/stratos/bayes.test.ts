import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  bayesianPosterior,
  bayesianUpdateSequence,
  normalize,
  toIntegerPercents,
} from "./bayes";

const approx = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

describe("bayes", () => {
  it("normalizes to sum 1 and clamps negatives", () => {
    const n = normalize([2, 2, -5, 0]);
    assert.ok(approx(n.reduce((a, x) => a + x, 0), 1));
    assert.equal(n[2], 0);
    assert.ok(approx(n[0], 0.5));
  });

  it("uninformative (uniform) likelihood leaves prior unchanged", () => {
    const prior = [0.5, 0.3, 0.2];
    const post = bayesianPosterior(prior, [1, 1, 1]);
    post.forEach((p, i) => assert.ok(approx(p, prior[i])));
  });

  it("posterior matches hand calculation", () => {
    // prior 0.5/0.5, likelihood 0.8/0.2 → posterior 0.8/0.2
    const post = bayesianPosterior([0.5, 0.5], [0.8, 0.2]);
    assert.ok(approx(post[0], 0.8));
    assert.ok(approx(post[1], 0.2));
  });

  it("sequential independent updates are order-independent", () => {
    const prior = [0.4, 0.35, 0.25];
    const e1 = [1.5, 1, 0.8];
    const e2 = [0.9, 1.2, 1];
    const ab = bayesianUpdateSequence(prior, [e1, e2]);
    const ba = bayesianUpdateSequence(prior, [e2, e1]);
    ab.forEach((p, i) => assert.ok(approx(p, ba[i])));
  });

  it("integer percents sum to exactly 100", () => {
    const pct = toIntegerPercents([0.527, 0.137, 0.336]);
    assert.equal(pct.reduce((a, x) => a + x, 0), 100);
    assert.ok(pct[0] >= pct[2] && pct[2] >= pct[1]);
  });

  it("throws on length mismatch", () => {
    assert.throws(() => bayesianPosterior([0.5, 0.5], [1]));
  });
});
