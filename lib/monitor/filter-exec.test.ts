import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { filterExecBundle, filterExecByProjectScope, executionHrefForSlice } from "./filter-exec";
import type { ExecBundle } from "./filter-exec";
import type { OrgSlice } from "./org-slices";

const HW_SLICE: OrgSlice = { id: "org-exec-hw", label: "热水事业部", keywords: ["热水", "热泵", "储水", "张健", "李伟"] };

function makeBundle(): ExecBundle {
  const base = {
    source: "demo" as const,
    diagnosis: { summary: "" },
    leadingKrs: [],
    allKrs: [],
    objectives: [],
    scoreboard: { items: [] },
    scoreboardConfigSource: "demo" as const,
    scoreboardConfig: { items: [] },
    horizonBubbles: [],
    riceItems: [],
    trlRadar: [],
    executionAnalyticsSource: "demo" as const,
    marketResponses: [],
    competitivePositions: [],
    executionAnalytics: {},
  };
  return {
    ...base,
    projects: [
      { id: "p1", code: "V1", name: "热水渠道升级", owner: "毕韬", status: "active" as const, horizon: "H1" as const, budget: 0, actualSpend: 0, health: "green" as const },
      { id: "p2", code: "V4", name: "热泵新品上市", owner: "张健", status: "active" as const, horizon: "H2" as const, budget: 0, actualSpend: 0, health: "yellow" as const },
      { id: "p3", code: "V6", name: "区域 M&A 预研", owner: "战略组", status: "active" as const, horizon: "H3" as const, budget: 0, actualSpend: 0, health: "red" as const },
    ],
    tensions: [
      { id: "t1", projectCode: "V1", projectName: "热水渠道升级", tensionType: "direction" as const, signal: "签约量", severity: "medium" as const, diagnosis: "", recommendation: "" },
      { id: "t2", projectCode: "V4", projectName: "热泵新品上市", tensionType: "capability" as const, signal: "样机测试", severity: "high" as const, diagnosis: "", recommendation: "" },
      { id: "t3", projectCode: "V6", projectName: "区域 M&A 预研", tensionType: "adaptation" as const, signal: "预研进度", severity: "high" as const, diagnosis: "", recommendation: "" },
    ],
    maturityPoints: [
      { projectCode: "V1", projectName: "热水渠道升级", owner: "毕韬", milestoneOnTimeRate: 0.8, assumptionHitRate: 0.7, responseLatencyDays: 6, budgetTotal: 180, tensionType: "direction" as const, horizon: "H1" as const },
      { projectCode: "V4", projectName: "热泵新品上市", owner: "张健", milestoneOnTimeRate: 0.4, assumptionHitRate: 0.5, responseLatencyDays: 18, budgetTotal: 150, tensionType: "capability" as const, horizon: "H2" as const },
      { projectCode: "V6", projectName: "区域 M&A 预研", owner: "战略组", milestoneOnTimeRate: 0.1, assumptionHitRate: 0.3, responseLatencyDays: 45, budgetTotal: 50, tensionType: "adaptation" as const, horizon: "H3" as const },
    ],
    commitments: [
      { id: "c1", owner: "毕韬", department: "热水事业部", content: "拓展华东渠道", deadline: "2026-06-30", status: "active" as const, linkedProjectCode: "V1" },
      { id: "c2", owner: "张健", department: "研发中心", content: "完成热泵样机", deadline: "2026-07-15", status: "active" as const, linkedProjectCode: "V4" },
      { id: "c3", owner: "战略组", department: "战略部", content: "M&A 标的筛选", deadline: "2026-08-01", status: "active" as const, linkedProjectCode: "V6" },
    ],
    techSignals: [
      { id: "s1", title: "热泵专利", domain: "热泵", linkedProjectCode: "V4" },
      { id: "s2", title: "IoT 平台", domain: "IoT", linkedProjectCode: "V6" },
    ],
    assumptions: [
      { id: "a1", code: "H1", content: "恒热渠道升级假设" },
      { id: "a2", code: "H2", content: "热泵市场假设" },
    ],
    reportSignals: [],
  } as unknown as ExecBundle;
}

describe("filter-exec", () => {
  it("filterExecBundle keeps only projects matching the slice keywords", () => {
    const bundle = makeBundle();
    const filtered = filterExecBundle(bundle, HW_SLICE);
    const codes = filtered.projects.map((p) => p.code);
    assert.deepEqual(codes.sort(), ["V1", "V4"]);
    assert.equal(filtered.tensions.length, 2);
    assert.equal(filtered.maturityPoints.length, 2);
    assert.equal(filtered.commitments.length, 2);
    assert.equal(filtered.techSignals.length, 1);
  });

  it("filterExecByProjectScope keeps only assigned project codes", () => {
    const bundle = makeBundle();
    const filtered = filterExecByProjectScope(bundle, ["V4"]);
    assert.deepEqual(filtered.projects.map((p) => p.code), ["V4"]);
    assert.equal(filtered.tensions.length, 1);
    assert.equal(filtered.maturityPoints.length, 1);
    assert.equal(filtered.commitments.length, 1);
    assert.equal(filtered.techSignals.length, 1);
  });

  it("combined slice + project scope filters intersect", () => {
    const bundle = makeBundle();
    const sliceFiltered = filterExecBundle(bundle, HW_SLICE);
    const scopeFiltered = filterExecByProjectScope(sliceFiltered, ["V4"]);
    assert.deepEqual(scopeFiltered.projects.map((p) => p.code), ["V4"]);
    assert.equal(scopeFiltered.tensions.length, 1);
  });

  it("executionHrefForSlice builds query link", () => {
    assert.equal(executionHrefForSlice("org-exec-hw"), "/execution?unit=org-exec-hw");
  });
});
