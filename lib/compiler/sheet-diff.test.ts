import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildSheetDiff, recordKey, SHEET_COMMIT_KEYS } from "./sheet-diff";

describe("recordKey", () => {
  it("单键提取并 trim", () => {
    assert.equal(recordKey({ code: " H1 " }, ["code"]), "H1");
  });

  it("多键拼接", () => {
    assert.equal(recordKey({ code: "H1", period: "2026-FY" }, ["code", "period"]), "H1\u241f2026-FY");
  });

  it("键字段缺失 → null", () => {
    assert.equal(recordKey({ code: "" }, ["code"]), null);
    assert.equal(recordKey({}, ["code"]), null);
  });
});

describe("buildSheetDiff", () => {
  const existing = new Map<string, Record<string, unknown>>([
    ["H1", { code: "H1", content: "酒店需求持续", result: "pending" }],
    ["H2", { code: "H2", content: "科技住宅渗透", result: "validated" }],
  ]);

  it("对齐后分类 new / update / unchanged", () => {
    const d = buildSheetDiff(
      [
        { code: "H1", content: "酒店需求持续", result: "validated" }, // update: result 变了
        { code: "H2", content: "科技住宅渗透", result: "validated" }, // unchanged
        { code: "H9", content: "新假设" }, // new
      ],
      existing,
      ["code"],
    );
    assert.equal(d.created, 1);
    assert.equal(d.updated, 1);
    assert.equal(d.unchanged, 1);
    const upd = d.rows.find((r) => r.status === "update");
    assert.deepEqual(upd?.changes, [{ field: "result", before: "pending", after: "validated" }]);
  });

  it("Excel 未提供的字段不算变更", () => {
    const d = buildSheetDiff([{ code: "H1", content: "酒店需求持续" }], existing, ["code"]);
    assert.equal(d.unchanged, 1);
  });

  it("数值容差比较(字符串 vs number)", () => {
    const ex = new Map([["2026-FY", { period: "2026-FY", revenueBudget: 6000 }]]);
    const d = buildSheetDiff([{ period: "2026-FY", revenueBudget: 6000.0 }], ex, ["period"]);
    assert.equal(d.unchanged, 1);
    const d2 = buildSheetDiff([{ period: "2026-FY", revenueBudget: 6100 }], ex, ["period"]);
    assert.equal(d2.updated, 1);
  });

  it("键缺失的行视为 new(无键)", () => {
    const d = buildSheetDiff([{ content: "无编号行" }], existing, ["code"]);
    assert.equal(d.created, 1);
    assert.equal(d.rows[0].key, "(无键)");
  });

  it("before 为 null 而 after 有值 → update", () => {
    const ex = new Map([["V1", { code: "V1", owner: null }]]);
    const d = buildSheetDiff([{ code: "V1", owner: "张三" }], ex, ["code"]);
    assert.equal(d.updated, 1);
  });
});

describe("SHEET_COMMIT_KEYS", () => {
  it("三个 sheetType 均有业务键", () => {
    for (const t of ["finance", "assumptions", "projects"]) {
      assert.ok((SHEET_COMMIT_KEYS[t] ?? []).length > 0, t);
    }
  });
});
