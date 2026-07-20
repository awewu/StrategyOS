import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseNumeric,
  computeAttainment,
  buildBscComparison,
  type BaselineDim,
  type ActualDim,
  type ThresholdDim,
} from "./bsc-comparison";

test("parseNumeric extracts first numeric token across formats", () => {
  assert.equal(parseNumeric("6000 万"), 6000);
  assert.equal(parseNumeric("15%"), 15);
  assert.equal(parseNumeric("820/1200"), 820);
  assert.equal(parseNumeric("1,200 家"), 1200);
  assert.equal(parseNumeric("18:1"), 18);
  assert.equal(parseNumeric("无数据"), null);
  assert.equal(parseNumeric(null), null);
});

test("computeAttainment: numeric → attainment%+pace; else unknown", () => {
  assert.deepEqual(computeAttainment("1000", "1200"), { attainmentPct: 120, pace: "ahead" });
  assert.deepEqual(computeAttainment("1000", "900"), { attainmentPct: 90, pace: "on_track" });
  assert.deepEqual(computeAttainment("1000", "500"), { attainmentPct: 50, pace: "behind" });
  assert.deepEqual(computeAttainment("目标", "文本"), { attainmentPct: null, pace: "unknown" });
  assert.deepEqual(computeAttainment("1000", null), { attainmentPct: null, pace: "unknown" });
});

test("buildBscComparison keeps threshold(红线) and leading(OKR) strictly separate", () => {
  const baseline: BaselineDim[] = [
    { key: "financial", krs: [{ keyResult: "营收", target: "6000" }] },
    { key: "customer", krs: [{ keyResult: "NPS", target: "45" }] },
    { key: "process", krs: [] },
    { key: "learning", krs: [] },
  ];
  const actuals: ActualDim[] = [
    { key: "financial", light: "yellow", kpis: [{ name: "营收", value: "5120", target: "6000" }] },
    { key: "customer", light: "green", kpis: [{ name: "NPS", value: "48", target: "45" }] },
    { key: "process", light: "red", kpis: [] },
    { key: "learning", light: "green", kpis: [] },
  ];
  const thresholds: ThresholdDim[] = [
    { key: "financial", statements: [{ statement: "Runway < 3月 → HardBlock", status: "red" }] },
    { key: "customer", statements: [{ statement: "P0 覆盖缺失", status: "yellow" }] },
    { key: "process", statements: [] },
    { key: "learning", statements: [] },
  ];
  const cmp = buildBscComparison(baseline, actuals, thresholds, { version: 3, status: "LOCKED", label: "V3" });

  assert.equal(cmp.hasBaseline, true);
  assert.equal(cmp.anyBreached, true); // financial threshold red

  const fin = cmp.dims.find((d) => d.key === "financial")!;
  // leading: 营收 matched actual 5120 vs target 6000 → 85% on_track, NOT an alarm
  assert.equal(fin.leading[0].actual, "5120");
  assert.equal(fin.leading[0].attainmentPct, 85);
  assert.equal(fin.leading[0].pace, "on_track");
  // threshold: red-line breached
  assert.equal(fin.thresholds[0].breached, true);

  const cust = cmp.dims.find((d) => d.key === "customer")!;
  assert.equal(cust.leading[0].attainmentPct, 107); // 48/45
  assert.equal(cust.thresholds[0].breached, false); // yellow, not breached
});

test("buildBscComparison: FPA finance block computes revenue/profit attainment", () => {
  const cmp = buildBscComparison(
    [{ key: "financial", krs: [] }, { key: "customer", krs: [] }, { key: "process", krs: [] }, { key: "learning", krs: [] }],
    [{
      key: "financial",
      light: "yellow",
      kpis: [],
      finance: { revenueActual: 5120, revenueBudget: 6000, profitActual: 720, profitBudget: 880, cashRunwayMonths: 2.1 },
    }],
    [],
    { version: 2, status: "LOCKED", label: "V2" },
  );
  const fin = cmp.dims.find((d) => d.key === "financial")!;
  assert.ok(fin.finance);
  assert.equal(fin.finance!.revenueAttainmentPct, 85); // 5120/6000
  assert.equal(fin.finance!.profitAttainmentPct, 82); // 720/880
  assert.equal(fin.finance!.cashRunwayMonths, 2.1);
  // non-financial dims get no finance block
  assert.equal(cmp.dims.find((d) => d.key === "customer")!.finance, undefined);
});

test("matcher (A5): short-name KPI does NOT falsely match a rate KR", () => {
  // KR 是增长率(营收 CAGR ≥ 15%)，实际 KPI 是绝对营收值(名称"营收")；不应误配。
  const cmp = buildBscComparison(
    [{ key: "financial", krs: [{ keyResult: "营收 CAGR ≥ 15%", target: "15%" }] }, { key: "customer", krs: [] }, { key: "process", krs: [] }, { key: "learning", krs: [] }],
    [{ key: "financial", light: "yellow", kpis: [{ name: "营收", value: "5120", target: "6000" }] }],
    [],
    { version: 1, status: "SUBMITTED", label: "V1" },
  );
  const fin = cmp.dims.find((d) => d.key === "financial")!;
  assert.equal(fin.leading[0].actual, null); // 未误配到 5120
});

test("matcher: exact normalized name wins over unrelated KPIs", () => {
  const cmp = buildBscComparison(
    [{ key: "customer", krs: [{ keyResult: "NPS", target: "45" }] }, { key: "financial", krs: [] }, { key: "process", krs: [] }, { key: "learning", krs: [] }],
    [{ key: "customer", light: "green", kpis: [{ name: "客户满意度", value: "9", target: "10" }, { name: "NPS", value: "48", target: "45" }] }],
    [],
    { version: 1, status: "LOCKED", label: "V1" },
  );
  const cust = cmp.dims.find((d) => d.key === "customer")!;
  assert.equal(cust.leading[0].actual, "48");
});

test("matcher (P1-1): stable code exact match wins over name, cross naming", () => {
  const cmp = buildBscComparison(
    [{ key: "process", krs: [{ keyResult: "平台准时率", target: "85", code: "PROC-OT" }] }, { key: "financial", krs: [] }, { key: "customer", krs: [] }, { key: "learning", krs: [] }],
    // KPI 名称与 KR 完全不同，但 code 相同 → 应命中
    [{ key: "process", light: "yellow", kpis: [{ name: "on-time delivery", value: "88", target: "85", code: "PROC-OT" }] }],
    [],
    { version: 4, status: "LOCKED", label: "V4" },
  );
  const proc = cmp.dims.find((d) => d.key === "process")!;
  assert.equal(proc.leading[0].actual, "88");
  assert.equal(proc.leading[0].attainmentPct, 104);
});

test("matcher (P1-1): code mismatch falls back to name matching", () => {
  const cmp = buildBscComparison(
    [{ key: "customer", krs: [{ keyResult: "NPS", target: "45", code: "C-NPS" }] }, { key: "financial", krs: [] }, { key: "process", krs: [] }, { key: "learning", krs: [] }],
    [{ key: "customer", light: "green", kpis: [{ name: "NPS", value: "48", target: "45", code: "OTHER" }] }],
    [],
    { version: 1, status: "SUBMITTED", label: "V1" },
  );
  const cust = cmp.dims.find((d) => d.key === "customer")!;
  assert.equal(cust.leading[0].actual, "48"); // code 不同但名称精确 → 命中
});

test("buildBscComparison: leading KR with no matching actual → actual null, pace unknown", () => {
  const cmp = buildBscComparison(
    [{ key: "financial", krs: [{ keyResult: "神秘指标", target: "100" }] }, { key: "customer", krs: [] }, { key: "process", krs: [] }, { key: "learning", krs: [] }],
    [{ key: "financial", light: "green", kpis: [{ name: "别的", value: "9", target: "10" }] }],
    [],
    { version: 1, status: "SUBMITTED", label: "V1" },
  );
  const fin = cmp.dims.find((d) => d.key === "financial")!;
  assert.equal(fin.leading[0].actual, null);
  assert.equal(fin.leading[0].pace, "unknown");
  assert.equal(cmp.anyBreached, false);
});
