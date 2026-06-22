import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  normalizePremiseCode,
  premiseMatchesCode,
  premiseCodeForIndex,
} from "./plan-assumption-sync";

describe("plan-assumption-sync codes", () => {
  it("maps H codes to P codes", () => {
    assert.equal(normalizePremiseCode("H2"), "P2");
    assert.equal(normalizePremiseCode("h5"), "P5");
    assert.equal(normalizePremiseCode("P3"), "P3");
  });

  it("matches H and P equivalents", () => {
    assert.equal(premiseMatchesCode("P2", "H2"), true);
    assert.equal(premiseMatchesCode("H5", "P5"), true);
    assert.equal(premiseMatchesCode("P1", "P2"), false);
  });

  it("index codes", () => {
    assert.equal(premiseCodeForIndex(0), "P1");
    assert.equal(premiseCodeForIndex(5), "P6");
  });
});
