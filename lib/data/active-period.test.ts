import { test } from "node:test";
import assert from "node:assert/strict";
import {
  pickActivePeriod,
  createActivePeriodResolver,
  type ActivePeriodSource,
} from "./active-period";
import { CURRENT_PERIOD } from "@/lib/constants";

/**
 * Build a controllable fake source with call counters and a mutable clock.
 * Counters always wrap the provided values, so callers configure data (not
 * the counting behaviour).
 */
function fakeSource(opts: {
  dbAvailable?: boolean;
  setting?: string | null | (() => string | null);
  periods?: string[] | (() => string[]);
  throwOn?: "setting" | "periods";
} = {}) {
  const calls = { setting: 0, periods: 0, dbAvailable: 0 };
  let clock = 1_000;
  const source: ActivePeriodSource = {
    dbAvailable: async () => {
      calls.dbAvailable++;
      return opts.dbAvailable ?? true;
    },
    loadSetting: async () => {
      calls.setting++;
      if (opts.throwOn === "setting") throw new Error("boom");
      const s = opts.setting;
      return typeof s === "function" ? s() : s ?? null;
    },
    loadCompanyPeriods: async () => {
      calls.periods++;
      if (opts.throwOn === "periods") throw new Error("boom");
      const p = opts.periods;
      return typeof p === "function" ? p() : p ?? [];
    },
    now: () => clock,
  };
  return { source, calls, advance: (ms: number) => (clock += ms) };
}

test("pickActivePeriod prefers highest year", () => {
  assert.equal(pickActivePeriod(["2025-FY", "2026-FY", "2024-FY"]), "2026-FY");
});

test("pickActivePeriod prefers FY over halves within a year", () => {
  assert.equal(pickActivePeriod(["2026-H1", "2026-FY", "2026-H2"]), "2026-FY");
});

test("pickActivePeriod ranks H2 above H1 when no FY present", () => {
  assert.equal(pickActivePeriod(["2026-H1", "2026-H2"]), "2026-H2");
});

test("pickActivePeriod falls back when nothing parseable", () => {
  assert.equal(pickActivePeriod(["garbage", ""], "2026-FY"), "2026-FY");
});

test("pickActivePeriod falls back on empty input", () => {
  assert.equal(pickActivePeriod([], "2027-FY"), "2027-FY");
});

test("pickActivePeriod uses latest year even if earlier year has FY", () => {
  assert.equal(pickActivePeriod(["2026-FY", "2027-H1"]), "2027-H1");
});

test("resolver: explicit setting takes priority over FpaPeriod heuristic", async () => {
  const { source, calls } = fakeSource({ setting: "2030-FY", periods: ["2026-FY", "2027-FY"] });
  const r = createActivePeriodResolver(source);
  assert.equal(await r.get(), "2030-FY");
  assert.equal(calls.periods, 0);
});

test("resolver: empty/whitespace setting falls back to FpaPeriod heuristic", async () => {
  const { source, calls } = fakeSource({ setting: "   ", periods: ["2026-H1", "2026-FY"] });
  const r = createActivePeriodResolver(source);
  assert.equal(await r.get(), "2026-FY");
  assert.equal(calls.periods, 1);
});

test("resolver: falls back to CURRENT_PERIOD when db unavailable", async () => {
  const { source, calls } = fakeSource({ dbAvailable: false });
  const r = createActivePeriodResolver(source);
  assert.equal(await r.get(), CURRENT_PERIOD);
  assert.equal(calls.setting, 0);
});

test("resolver: falls back to CURRENT_PERIOD when a loader throws", async () => {
  const { source } = fakeSource({ throwOn: "setting" });
  const r = createActivePeriodResolver(source);
  assert.equal(await r.get(), CURRENT_PERIOD);
});

test("resolver: caches within TTL (loaders hit once)", async () => {
  const { source, calls, advance } = fakeSource({ setting: "2028-FY" });
  const r = createActivePeriodResolver(source, 30_000);
  assert.equal(await r.get(), "2028-FY");
  advance(10_000);
  assert.equal(await r.get(), "2028-FY");
  assert.equal(calls.setting, 1);
});

test("resolver: re-resolves after TTL expiry", async () => {
  let value = "2028-FY";
  const { source, calls, advance } = fakeSource({ setting: () => value });
  const r = createActivePeriodResolver(source, 30_000);
  assert.equal(await r.get(), "2028-FY");
  value = "2029-FY";
  advance(31_000);
  assert.equal(await r.get(), "2029-FY");
  assert.equal(calls.setting, 2);
});

test("resolver: reset() forces re-resolution", async () => {
  let value = "2028-FY";
  const { source, calls } = fakeSource({ setting: () => value });
  const r = createActivePeriodResolver(source);
  assert.equal(await r.get(), "2028-FY");
  value = "2031-FY";
  r.reset();
  assert.equal(await r.get(), "2031-FY");
  assert.equal(calls.setting, 2);
});
