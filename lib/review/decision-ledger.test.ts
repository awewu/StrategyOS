import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SnapshotStatePayload } from "@/lib/types/stratos";
import { buildDecisionLedger } from "./decision-ledger";

function payload(p: Partial<SnapshotStatePayload>): SnapshotStatePayload {
  return p;
}

const from = payload({
  investmentCases: [
    { id: "ic1", code: "IC-1", title: "产能扩建", type: "capacity", horizon: "H1", capexTotal: 800, gateStatus: "approved", budgetTag: "IC-1", fpaToggle: "on" },
    { id: "ic2", code: "IC-2", title: "海外仓", type: "channel", horizon: "H2", capexTotal: 300, gateStatus: "killed", budgetTag: "IC-2", fpaToggle: "off" },
  ],
  productBets: [
    { id: "pb1", title: "V4 热泵", horizon: "H2", gateStatus: "approved", fpaToggle: "on" },
    { id: "pb2", title: "储能试点", horizon: "H3", gateStatus: "post_invest", fpaToggle: "on" },
  ],
  gtmBets: [{ id: "gb1", title: "酒店 1200 家", gateStatus: "approved", fpaToggle: "on" }],
  assumptions: [
    { id: "a1", code: "H1", content: "史密斯不降价", cynefinDomain: "complicated", result: "pending" },
    { id: "a2", code: "H2", content: "酒店渠道回暖", cynefinDomain: "complex", result: "pending" },
    { id: "a3", code: "H3", content: "补贴延续", cynefinDomain: "clear", result: "validated" },
  ],
  fpa: { revenueBudget: 6000, revenueActual: 2800, revenueForecast: 5800, profitBudget: 900, profitActual: 400, profitForecast: 860, cashRunwayMonths: 6 },
});

const to = payload({
  investmentCases: [
    { id: "ic1", code: "IC-1", title: "产能扩建", type: "capacity", horizon: "H1", capexTotal: 800, gateStatus: "post_invest", budgetTag: "IC-1", fpaToggle: "on" },
    { id: "ic2", code: "IC-2", title: "海外仓", type: "channel", horizon: "H2", capexTotal: 300, gateStatus: "approved", budgetTag: "IC-2", fpaToggle: "on" },
  ],
  productBets: [
    { id: "pb1", title: "V4 热泵", horizon: "H2", gateStatus: "killed", fpaToggle: "off" },
    // pb2 missing from to-snapshot
  ],
  gtmBets: [{ id: "gb1", title: "酒店 1200 家", gateStatus: "approved", fpaToggle: "on" }],
  assumptions: [
    { id: "a1", code: "H1", content: "史密斯不降价", cynefinDomain: "complicated", result: "failed" },
    { id: "a2", code: "H2", content: "酒店渠道回暖", cynefinDomain: "complex", result: "pending" },
  ],
  fpa: { revenueBudget: 6000, revenueActual: 5000, revenueForecast: 5100, profitBudget: 900, profitActual: 800, profitForecast: 820, cashRunwayMonths: 5 },
});

describe("决策记分卡", () => {
  const ledger = buildDecisionLedger(from, to);

  it("go 判断复核:4 项 go,2 项存活,命中率 50%", () => {
    assert.equal(ledger.gate.total, 4);
    assert.equal(ledger.gate.held, 2);
    assert.equal(ledger.gate.hitRatePct, 50);
    const titles = ledger.gate.reversals.map((r) => r.title).sort();
    assert.deepEqual(titles, ["V4 热泵", "储能试点"]);
    assert.equal(ledger.gate.reversals.find((r) => r.title === "储能试点")?.toStatus, "missing");
  });

  it("kill 复活被标出", () => {
    assert.equal(ledger.revivals.length, 1);
    assert.equal(ledger.revivals[0].title, "海外仓");
  });

  it("假设结案:2 项 pending,1 项证伪,结案率 50%", () => {
    assert.equal(ledger.assumptions.pendingAtFrom, 2);
    assert.equal(ledger.assumptions.resolved, 1);
    assert.equal(ledger.assumptions.failed, 1);
    assert.equal(ledger.assumptions.resolutionRatePct, 50);
    assert.match(ledger.assumptions.newlyFailed[0], /史密斯不降价/);
  });

  it("预测校准:forecast 5800 vs actual 5000 → +16%", () => {
    assert.equal(ledger.forecast.revenueBiasPct, 16);
  });

  it("复盘提示含翻车、复活与乐观偏差", () => {
    assert.ok(ledger.prompts.some((p) => p.includes("翻车")));
    assert.ok(ledger.prompts.some((p) => p.includes("复活")));
    assert.ok(ledger.prompts.some((p) => p.includes("系统性乐观")));
  });

  it("空快照不崩:比率为 null", () => {
    const empty = buildDecisionLedger({}, {});
    assert.equal(empty.gate.hitRatePct, null);
    assert.equal(empty.assumptions.resolutionRatePct, null);
    assert.equal(empty.forecast.revenueBiasPct, null);
    assert.deepEqual(empty.prompts, []);
  });
});
