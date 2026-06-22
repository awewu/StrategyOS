import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { monteCarloForecast } from "./monte-carlo";
import type { Scenario } from "@/lib/types/stratos";

const scenarios: Scenario[] = [
  {
    id: "base",
    name: "基准",
    probability: 55,
    drivers: [],
    fpaImpact: { revenue: 5800, profit: 820, runwayMonths: 2.1 },
    linkedAssumptionCodes: [],
  },
  {
    id: "opt",
    name: "乐观",
    probability: 20,
    drivers: [],
    fpaImpact: { revenue: 6400, profit: 980, runwayMonths: 3.2 },
    linkedAssumptionCodes: [],
  },
  {
    id: "pess",
    name: "悲观",
    probability: 25,
    drivers: [],
    fpaImpact: { revenue: 5200, profit: 580, runwayMonths: 1.4 },
    linkedAssumptionCodes: [],
  },
];

describe("monte-carlo", () => {
  it("is deterministic for a fixed seed", () => {
    const a = monteCarloForecast(scenarios, { seed: 7, iterations: 2000 });
    const b = monteCarloForecast(scenarios, { seed: 7, iterations: 2000 });
    assert.deepEqual(a, b);
  });

  it("produces ordered percentiles p10 <= p50 <= p90", () => {
    const r = monteCarloForecast(scenarios, { iterations: 5000 });
    assert.ok(r.runway.p10 <= r.runway.p50);
    assert.ok(r.runway.p50 <= r.runway.p90);
    assert.ok(r.revenue.p10 <= r.revenue.p90);
  });

  it("mean revenue approximates the probability-weighted mean", () => {
    const r = monteCarloForecast(scenarios, { iterations: 20000, cv: 0.05 });
    const weighted = (5800 * 55 + 6400 * 20 + 5200 * 25) / 100;
    assert.ok(Math.abs(r.revenue.mean - weighted) / weighted < 0.03);
  });

  it("runway breach probability is in [0,1] and reflects the threshold", () => {
    const r = monteCarloForecast(scenarios, { iterations: 5000, runwayThreshold: 3 });
    assert.ok(r.probRunwayBreach >= 0 && r.probRunwayBreach <= 1);
    // base+pess (80%) sit below 3 months → breach probability should be high
    assert.ok(r.probRunwayBreach > 0.5);
  });

  it("handles empty scenarios safely", () => {
    const r = monteCarloForecast([], { iterations: 100 });
    assert.equal(r.iterations, 0);
    assert.equal(r.probRunwayBreach, 0);
  });
});
