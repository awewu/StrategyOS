import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { canTransition } from "@/lib/finance/budget-versions";

describe("canTransition（预算版本状态机）", () => {
  it("合法流转：草案→上报→批准/退回；退回→修订回草案", () => {
    assert.equal(canTransition("draft", "submit"), "submitted");
    assert.equal(canTransition("submitted", "approve"), "approved");
    assert.equal(canTransition("submitted", "reject"), "rejected");
    assert.equal(canTransition("rejected", "revise"), "draft");
  });
  it("非法流转全部拒绝（批准为终态）", () => {
    assert.equal(canTransition("draft", "approve"), null);
    assert.equal(canTransition("draft", "reject"), null);
    assert.equal(canTransition("approved", "submit"), null);
    assert.equal(canTransition("approved", "revise"), null);
    assert.equal(canTransition("submitted", "submit"), null);
    assert.equal(canTransition("rejected", "submit"), null);
  });
});
