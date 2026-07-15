import { test } from "node:test";
import assert from "node:assert/strict";
import {
  LEDGER_SOURCES,
  contentHash,
  listLedgerSources,
} from "./ledger-import-access";

test("listLedgerSources 覆盖全部 9 种来源，含 needsPeriod/sheetHint", () => {
  const list = listLedgerSources();
  assert.equal(list.length, 9);
  const byKind = Object.fromEntries(list.map((s) => [s.kind, s]));
  // 映射类不需要期间
  assert.equal(byKind.account_map.needsPeriod, false);
  assert.equal(byKind.dept_map.needsPeriod, false);
  // GL/TB/事实类需要期间
  assert.equal(byKind.trial_balance.needsPeriod, true);
  assert.equal(byKind.gl_detail.needsPeriod, true);
  assert.equal(byKind.fact_entry.needsPeriod, true);
  assert.equal(byKind.pvi_sales.needsPeriod, true);
  for (const s of list) assert.ok(s.label && s.sheetHint);
});

test("trial_balance.resolveSheet 优先 TB_ 前缀，其次 Sheet1，再退首表", () => {
  const spec = LEDGER_SOURCES.trial_balance;
  assert.equal(spec.resolveSheet(["Cover", "TB_5RC", "Sheet1"]), "TB_5RC");
  assert.equal(spec.resolveSheet(["Cover", "Sheet1"]), "Sheet1");
  assert.equal(spec.resolveSheet(["OnlyOne"]), "OnlyOne");
  assert.equal(spec.resolveSheet([]), null);
});

test("gl_detail.resolveSheet 命中 GL_ 前缀", () => {
  assert.equal(LEDGER_SOURCES.gl_detail.resolveSheet(["Meta", "GL_202412"]), "GL_202412");
});

test("account_map / dept_map / pvi 解析到具名工作表", () => {
  assert.equal(LEDGER_SOURCES.account_map.resolveSheet(["X", "Acct Mapping"]), "Acct Mapping");
  assert.equal(LEDGER_SOURCES.dept_map.resolveSheet(["Department Mapping", "X"]), "Department Mapping");
  assert.equal(LEDGER_SOURCES.pvi_sales.resolveSheet(["PVI Data", "Y"]), "PVI Data");
});

test("fact_entry.resolveSheet 支持 preferred + JE 具名表", () => {
  const spec = LEDGER_SOURCES.fact_entry;
  assert.equal(spec.resolveSheet(["JE Actual", "JE Forecast"], "JE Forecast"), "JE Forecast");
  assert.equal(spec.resolveSheet(["Cover", "JE Actual"]), "JE Actual");
});

test("contentHash 确定性 + 对工作表名敏感", () => {
  const buf = Buffer.from("hello ledger");
  assert.equal(contentHash(buf, "Sheet1"), contentHash(buf, "Sheet1"));
  assert.notEqual(contentHash(buf, "Sheet1"), contentHash(buf, "Sheet2"));
});
