import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveScopeLabels } from "./scope";

describe("resolveScopeLabels · demo scope (no session)", () => {
  it("executives (ceo) → full company: no org labels, no projects", () => {
    const s = resolveScopeLabels("ceo");
    assert.deepEqual(s.orgLabels, []);
    assert.deepEqual(s.projectCodes, []);
  });

  it("vp → own BU name (热水事业部), no project", () => {
    const s = resolveScopeLabels("vp");
    assert.deepEqual(s.orgLabels, ["热水事业部"]);
    assert.deepEqual(s.projectCodes, []);
  });

  it("system_head → own function name (研发中心)", () => {
    const s = resolveScopeLabels("system_head");
    assert.deepEqual(s.orgLabels, ["研发中心"]);
  });

  it("pm → own BU + project code V4", () => {
    const s = resolveScopeLabels("pm");
    assert.deepEqual(s.orgLabels, ["热水事业部"]);
    assert.deepEqual(s.projectCodes, ["V4"]);
  });

  it("observer → read-only own BU name", () => {
    const s = resolveScopeLabels("observer");
    assert.deepEqual(s.orgLabels, ["热水事业部"]);
  });
});

describe("resolveScopeLabels · real session overrides demo", () => {
  it("uses session orgScopeIds to name the actual unit", () => {
    const s = resolveScopeLabels("vp", { orgScopeIds: ["org-exec-ac"], orgUnitId: null, projectCode: null });
    assert.deepEqual(s.orgLabels, ["空调事业部"]);
  });

  it("falls back to orgUnitId when orgScopeIds absent", () => {
    const s = resolveScopeLabels("system_head", { orgUnitId: "org-exec-brand", orgScopeIds: null, projectCode: null });
    assert.deepEqual(s.orgLabels, ["品牌事业部"]);
  });

  it("carries the session project code", () => {
    const s = resolveScopeLabels("pm", { orgUnitId: "org-exec-hw", orgScopeIds: null, projectCode: "V7" });
    assert.deepEqual(s.projectCodes, ["V7"]);
  });

  it("unknown org id is dropped, not shown as a raw id", () => {
    const s = resolveScopeLabels("vp", { orgScopeIds: ["org-nonexistent"], orgUnitId: null, projectCode: null });
    assert.deepEqual(s.orgLabels, []);
  });
});
