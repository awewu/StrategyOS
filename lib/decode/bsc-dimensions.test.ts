import { test } from "node:test";
import assert from "node:assert/strict";
import {
  BSC_DIM_KEYS,
  BSC_DIM_ENUMS,
  BSC_DIM_LABEL,
  BSC_ENUM_LABEL,
  keyToEnum,
  enumToKey,
  toBscDimKey,
  toBscDimEnum,
} from "./bsc-dimensions";

test("taxonomy has exactly the four BSC dimensions in order", () => {
  assert.deepEqual(BSC_DIM_KEYS, ["financial", "customer", "process", "learning"]);
  assert.deepEqual(BSC_DIM_ENUMS, ["FINANCIAL", "CUSTOMER", "PROCESS", "LEARNING"]);
});

test("label maps are consistent across key/enum", () => {
  assert.equal(BSC_DIM_LABEL.financial, "财务");
  assert.equal(BSC_ENUM_LABEL.FINANCIAL, "财务");
  assert.equal(BSC_DIM_LABEL.learning, "学习");
  assert.equal(BSC_ENUM_LABEL.LEARNING, "学习");
});

test("key <-> enum roundtrip", () => {
  for (const key of BSC_DIM_KEYS) {
    assert.equal(enumToKey(keyToEnum(key)), key);
  }
});

test("toBscDimKey parses key / enum / 中文标签 / free string", () => {
  assert.equal(toBscDimKey("financial"), "financial");
  assert.equal(toBscDimKey("FINANCIAL"), "financial");
  assert.equal(toBscDimKey("财务"), "financial");
  assert.equal(toBscDimKey("客户满意度"), "customer");
  assert.equal(toBscDimKey("流程效率"), "process");
  assert.equal(toBscDimKey("learning & growth"), "learning");
  assert.equal(toBscDimKey("unrelated"), null);
  assert.equal(toBscDimKey(null), null);
  assert.equal(toBscDimKey(""), null);
});

test("toBscDimEnum maps labels/free strings to uppercase enum", () => {
  assert.equal(toBscDimEnum("客户"), "CUSTOMER");
  assert.equal(toBscDimEnum("process"), "PROCESS");
  assert.equal(toBscDimEnum("???"), null);
});
