import { test } from "node:test";
import assert from "node:assert/strict";
import {
  canTransition,
  computeChangeSet,
  normalizeRow,
  summarizeOps,
  validateRow,
  type EditableRow,
} from "./edit-proposals";

test("canTransition 状态机：草稿→提交→批准/退回；退回→修订", () => {
  assert.equal(canTransition("draft", "submit"), "submitted");
  assert.equal(canTransition("submitted", "approve"), "approved");
  assert.equal(canTransition("submitted", "reject"), "rejected");
  assert.equal(canTransition("rejected", "revise"), "draft");
  // 非法流转
  assert.equal(canTransition("draft", "approve"), null);
  assert.equal(canTransition("approved", "reject"), null);
  assert.equal(canTransition("submitted", "submit"), null);
});

test("normalizeRow：数值列解析千分位、空串→null、文本 trim", () => {
  const n = normalizeRow("ops_metric", { metricType: "headcount", period: " 2025-01 ", dim1: "", value: "1,234.5", unit: "人" });
  assert.equal(n.period, "2025-01");
  assert.equal(n.dim1, null);
  assert.equal(n.value, 1234.5);
  assert.equal(n.unit, "人");
});

test("validateRow：必填缺失 + 非法指标类型", () => {
  assert.match(validateRow("ops_metric", normalizeRow("ops_metric", { metricType: "headcount", period: "", value: "1" }))!, /期间/);
  assert.match(validateRow("ops_metric", normalizeRow("ops_metric", { metricType: "bogus", period: "2025-01", value: "1" }))!, /非法指标/);
  assert.equal(validateRow("ops_metric", normalizeRow("ops_metric", { metricType: "headcount", period: "2025-01", value: "5" })), null);
});

test("computeChangeSet：识别 update / create / delete，忽略未改动与空新行", () => {
  const baseline: EditableRow[] = [
    { id: "a", metricType: "headcount", period: "2025-01", dim1: "SH", dim2: null, value: 10, unit: "人" },
    { id: "b", metricType: "headcount", period: "2025-01", dim1: "BJ", dim2: null, value: 20, unit: "人" },
  ];
  const edited: EditableRow[] = [
    // a: 改 value 10→12
    { id: "a", metricType: "headcount", period: "2025-01", dim1: "SH", dim2: null, value: 12, unit: "人" },
    // b 缺失 → delete
    // 新行 create
    { id: "new:0", metricType: "capex", period: "2025-01", dim1: "IT", dim2: null, value: 99, unit: "USD" },
    // 空新行 → 忽略
    { id: "new:1", metricType: "", period: "", dim1: "", dim2: "", value: "", unit: "" },
  ];
  const { ops, errors } = computeChangeSet("ops_metric", baseline, edited);
  assert.equal(errors.length, 0);
  const s = summarizeOps(ops);
  assert.deepEqual(s, { creates: 1, updates: 1, deletes: 1 });
  const upd = ops.find((o) => o.op === "update");
  assert.ok(upd && upd.op === "update" && upd.before.value === 10 && upd.after.value === 12);
});

test("computeChangeSet：未改动行不产生 op", () => {
  const baseline: EditableRow[] = [
    { id: "a", metricType: "headcount", period: "2025-01", dim1: "SH", dim2: null, value: 10, unit: "人" },
  ];
  const edited: EditableRow[] = [
    { id: "a", metricType: "headcount", period: "2025-01", dim1: "SH", dim2: null, value: "10", unit: "人" },
  ];
  const { ops } = computeChangeSet("ops_metric", baseline, edited);
  assert.equal(ops.length, 0);
});

test("computeChangeSet：非法新行进 errors、不进 ops", () => {
  const { ops, errors } = computeChangeSet("ops_metric", [], [
    { id: "new:0", metricType: "headcount", period: "", dim1: "X", dim2: null, value: 5, unit: "人" },
  ]);
  assert.equal(ops.length, 0);
  assert.equal(errors.length, 1);
});

test("computeChangeSet：PVI 目标按 amount 主数值列", () => {
  const baseline: EditableRow[] = [
    { id: "p", businessUnit: "WH", reportingUnit: "5RC", productName: "X1", channel: null, category: null, launchPeriod: null, period: "2025-01", amount: 100 },
  ];
  const edited: EditableRow[] = [
    { id: "p", businessUnit: "WH", reportingUnit: "5RC", productName: "X1", channel: null, category: null, launchPeriod: null, period: "2025-01", amount: 150 },
  ];
  const { ops } = computeChangeSet("pvi_sales", baseline, edited);
  assert.equal(ops.length, 1);
  assert.ok(ops[0].op === "update" && ops[0].after.amount === 150);
});
