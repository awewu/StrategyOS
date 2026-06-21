import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSeriesFromActuals, getSignal, ALL_MONTHS, DOMAINS } from "./ops-metrics";

const firstMetric = DOMAINS[0].metrics[0];

test("buildSeriesFromActuals overlays DB rows and fills all months", () => {
  const map = new Map([
    [firstMetric.id, [
      { month: "2024-01", actual: 100, planned: 110 },
      { month: "2025-01", actual: 130, planned: 120 },
    ]],
  ]);
  const series = buildSeriesFromActuals(map);
  const s = series.find((x) => x.metricId === firstMetric.id);
  assert.ok(s, "metric series present");
  assert.equal(s!.points.length, ALL_MONTHS.length, "all months filled");
  const jan24 = s!.points.find((p) => p.month === "2024-01");
  assert.equal(jan24?.actual, 100);
  assert.equal(jan24?.planned, 110);
});

test("buildSeriesFromActuals recomputes yoy from prior-year actual", () => {
  const map = new Map([
    [firstMetric.id, [
      { month: "2024-01", actual: 100, planned: 110 },
      { month: "2025-01", actual: 130, planned: 120 },
    ]],
  ]);
  const series = buildSeriesFromActuals(map);
  const s = series.find((x) => x.metricId === firstMetric.id)!;
  const jan25 = s.points.find((p) => p.month === "2025-01");
  assert.equal(jan25?.yoy, 100, "yoy points to 2024-01 actual");
});

test("buildSeriesFromActuals falls back to generator for unknown metric", () => {
  const series = buildSeriesFromActuals(new Map());
  assert.equal(series.length, DOMAINS.flatMap((d) => d.metrics).length);
  assert.ok(series.every((s) => s.points.length === ALL_MONTHS.length));
});

test("getSignal respects higherIsBetter direction", () => {
  const up = { ...firstMetric, higherIsBetter: true, greenThreshold: 90, yellowThreshold: 75 };
  assert.equal(getSignal(95, up), "green");
  assert.equal(getSignal(80, up), "yellow");
  assert.equal(getSignal(50, up), "red");
  const down = { ...firstMetric, higherIsBetter: false, greenThreshold: 10, yellowThreshold: 20 };
  assert.equal(getSignal(5, down), "green");
  assert.equal(getSignal(15, down), "yellow");
  assert.equal(getSignal(30, down), "red");
});
