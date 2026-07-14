import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { applyForecastBias, calibrateForecastBias } from "./calibrate";

describe("calibrate", () => {
  it("detects optimistic plan bias from history", () => {
    // actuals consistently below budget → negative bias
    const cal = calibrateForecastBias([
      { budget: 100, actual: 90 },
      { budget: 200, actual: 180 },
    ]);
    assert.equal(cal.n, 2);
    assert.ok(cal.biasPct < 0);
    assert.ok(approx(cal.mape, 0.1));
  });

  it("debiases a forward forecast", () => {
    const cal = calibrateForecastBias([{ budget: 100, actual: 90 }]);
    const debiased = applyForecastBias(1000, cal);
    assert.ok(debiased < 1000);
  });

  it("returns identity calibration on empty history", () => {
    const cal = calibrateForecastBias([]);
    assert.equal(cal.n, 0);
    assert.equal(applyForecastBias(1234, cal), 1234);
  });

  it("shrinks the correction when history is sparse (n<3)", () => {
    const sparse = calibrateForecastBias([{ budget: 100, actual: 90 }]);
    const full = calibrateForecastBias([
      { budget: 100, actual: 90 },
      { budget: 100, actual: 90 },
      { budget: 100, actual: 90 },
    ]);
    // same fitted bias, but sparse applies only 1/3 of it
    assert.ok(approx(sparse.biasPct, full.biasPct));
    const sparseOut = applyForecastBias(1000, sparse);
    const fullOut = applyForecastBias(1000, full);
    assert.ok(sparseOut > fullOut); // sparse corrects less (closer to 1000)
    assert.ok(approx(sparseOut, 1000 * (1 + full.biasPct / 3)));
    assert.ok(approx(fullOut, 1000 * (1 + full.biasPct)));
  });

  it("applies full-strength bias at n>=3", () => {
    const cal = calibrateForecastBias([
      { budget: 100, actual: 80 },
      { budget: 100, actual: 80 },
      { budget: 100, actual: 80 },
      { budget: 100, actual: 80 },
    ]);
    assert.ok(approx(applyForecastBias(1000, cal), 1000 * (1 + cal.biasPct)));
  });
});

const approx = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;
