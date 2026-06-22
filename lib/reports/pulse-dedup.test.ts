import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatMonthlyPulse } from "@/lib/stratos/report-agent";
import { checkPulseBatchDuplicates, checkPulseDuplicate } from "./pulse-dedup";

describe("pulse-dedup", () => {
  it("checkPulseBatchDuplicates finds exact duplicates in batch", () => {
    const pulses = [
      { oneLiner: "酒店签约滞后", offTrackKr: "KR-酒店" },
      { oneLiner: "酒店签约滞后", offTrackKr: "KR-酒店" },
      { oneLiner: "产线良率提升", offTrackKr: "" },
    ];
    const result = checkPulseBatchDuplicates(pulses);
    assert.equal(result.unique, 2);
    assert.equal(result.duplicateIndexes.length, 1);
    assert.equal(result.duplicateIndexes[0], 1);
    assert.ok(result.message.includes("重复"));
  });

  it("checkPulseBatchDuplicates items link duplicate to prior index", () => {
    const pulses = [
      { oneLiner: "渠道拓展达标", offTrackKr: "KR-1" },
      { oneLiner: "渠道拓展达标", offTrackKr: "KR-1" },
    ];
    const result = checkPulseBatchDuplicates(pulses);
    assert.equal(result.items[1]!.duplicateOfIndex, 0);
    assert.equal(result.items[0]!.duplicateOfIndex, undefined);
  });

  it("checkPulseBatchDuplicates treats distinct oneLiners as unique", () => {
    const pulses = [
      { oneLiner: "A 项目进度正常" },
      { oneLiner: "B 项目进度正常" },
      { oneLiner: "C 项目进度正常" },
    ];
    const result = checkPulseBatchDuplicates(pulses);
    assert.equal(result.unique, 3);
    assert.equal(result.duplicateIndexes.length, 0);
  });

  it("checkPulseDuplicate returns skip message without database", async () => {
    const prev = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    try {
      const result = await checkPulseDuplicate("org-test", "2026-06", {
        oneLiner: "测试脉搏一句话",
      });
      assert.equal(result.isDuplicate, false);
      assert.equal(result.level, "none");
      assert.ok(result.message.includes("跳过查重"));
    } finally {
      if (prev !== undefined) process.env.DATABASE_URL = prev;
    }
  });

  it("formatted pulse text matches formatMonthlyPulse contract", () => {
    const fields = { oneLiner: "酒店签约滞后", offTrackKr: "KR-酒店", needHelp: "需协调资源" };
    const formatted = formatMonthlyPulse(fields);
    assert.ok(formatted.includes("§Pulse 本月一句话：酒店签约滞后"));
    assert.ok(formatted.includes("§Pulse 偏离KR：KR-酒店"));
    assert.ok(formatted.includes("§Pulse 需协调：需协调资源"));
  });
});
