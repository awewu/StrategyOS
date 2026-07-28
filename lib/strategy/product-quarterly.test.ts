import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_PRODUCT_QUARTERLY_YEARS,
  LEGACY_PRODUCT_QUARTERLY_YEAR,
  normalizeProductQuarterlyYears,
  productQuarterlyYearOrLegacy,
} from "./product-quarterly";

test("product quarterly years always include the fixed 2026-2028 tabs", () => {
  assert.deepEqual(normalizeProductQuarterlyYears(undefined), [...DEFAULT_PRODUCT_QUARTERLY_YEARS]);
});

test("legacy product rows are assigned to 2027", () => {
  assert.equal(productQuarterlyYearOrLegacy(undefined), LEGACY_PRODUCT_QUARTERLY_YEAR);
  assert.equal(productQuarterlyYearOrLegacy(""), LEGACY_PRODUCT_QUARTERLY_YEAR);
});

test("custom years from saved tabs and rows are retained once", () => {
  assert.deepEqual(
    normalizeProductQuarterlyYears([2026, 2029, 2029], [{ year: 2030 }, { year: 2027 }]),
    [2026, 2027, 2028, 2029, 2030],
  );
});
