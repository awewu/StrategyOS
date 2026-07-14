import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  SHEET_SPECS,
  applyProfile,
  guessColumnMap,
  parseNumberCell,
} from "./sheet-profiles";

describe("猜映射:表头相似度", () => {
  it("精确/别名/包含三级命中", () => {
    const headers = ["周期", "营收预算(万元)", "收入实际", "Runway月数", "备注"];
    const map = guessColumnMap(headers, SHEET_SPECS.finance);
    assert.equal(map.period, "周期");
    assert.equal(map.revenueBudget, "营收预算(万元)");
    assert.equal(map.revenueActual, "收入实际");
    assert.equal(map.cashRunwayMonths, "Runway月数");
    assert.equal(map.profitBudget, undefined);
  });

  it("英文表头也能猜中", () => {
    const map = guessColumnMap(["Period", "Revenue Budget", "Revenue Actual"], SHEET_SPECS.finance);
    assert.equal(map.period, "Period");
    assert.equal(map.revenueBudget, "Revenue Budget");
  });
});

describe("数值解析容错", () => {
  it("千分位/全角逗号/万后缀/百分号", () => {
    assert.equal(parseNumberCell("5,800"), 5800);
    assert.equal(parseNumberCell("5，800万"), 5800);
    assert.equal(parseNumberCell("12%"), 12);
    assert.equal(parseNumberCell(42), 42);
    assert.equal(parseNumberCell("abc"), undefined);
    assert.equal(parseNumberCell(""), undefined);
  });
});

describe("套用画像:映射+转换+预检", () => {
  const spec = SHEET_SPECS.assumptions;
  const map = { code: "编号", content: "假设内容", cynefinDomain: "域", result: "状态" };

  it("正常行:枚举中文别名归一化", () => {
    const { records, issues, errorRows } = applyProfile(
      [{ 编号: "H1", 假设内容: "竞品不降价", 域: "复杂", 状态: "待验证" }],
      spec,
      map,
    );
    assert.equal(errorRows, 0);
    assert.equal(issues.length, 0);
    assert.deepEqual(records[0], {
      code: "H1",
      content: "竞品不降价",
      cynefinDomain: "complex",
      result: "pending",
    });
  });

  it("必填缺失/非法枚举 → error 并计入 errorRows", () => {
    const { issues, errorRows } = applyProfile(
      [
        { 编号: "", 假设内容: "缺编号", 状态: "待验证" },
        { 编号: "H2", 假设内容: "非法枚举", 状态: "不知道" },
      ],
      spec,
      map,
    );
    assert.equal(errorRows, 2);
    assert.ok(issues.some((i) => i.row === 1 && i.severity === "error" && i.message.includes("编号")));
    assert.ok(issues.some((i) => i.row === 2 && i.message.includes("不知道")));
  });

  it("必填字段未映射列 → row 0 级 error", () => {
    const { issues } = applyProfile([], spec, { content: "假设内容" });
    assert.ok(issues.some((i) => i.row === 0 && i.field === "code" && i.severity === "error"));
  });

  it("空行跳过并给 warning", () => {
    const { records, issues } = applyProfile(
      [{ 编号: "", 假设内容: "", 域: "", 状态: "" }],
      { ...spec, fields: spec.fields.map((f) => ({ ...f, required: false })) },
      map,
    );
    assert.equal(records.length, 0);
    assert.ok(issues.some((i) => i.severity === "warning" && i.message.includes("空行")));
  });

  it("换列名 = 换 map,引擎零改动(泛化验收)", () => {
    const altMap = { code: "Hx No.", content: "Assumption", cynefinDomain: "Domain", result: "Result" };
    const { records } = applyProfile(
      [{ "Hx No.": "H9", Assumption: "channel rebound", Domain: "complex", Result: "pending" }],
      spec,
      altMap,
    );
    assert.equal(records[0].code, "H9");
    assert.equal(records[0].cynefinDomain, "complex");
  });
});

describe("项目群 Sheet 端到端", () => {
  it("数字容错 + 状态归一化", () => {
    const map = guessColumnMap(["项目编号", "项目名称", "进度%", "项目状态", "总预算", "风险等级"], SHEET_SPECS.projects);
    const { records, errorRows } = applyProfile(
      [{ 项目编号: "V4", 项目名称: "热泵上市", "进度%": "52%", 项目状态: "进行中", 总预算: "1,500", 风险等级: "高" }],
      SHEET_SPECS.projects,
      map,
    );
    assert.equal(errorRows, 0);
    assert.deepEqual(records[0], {
      code: "V4",
      name: "热泵上市",
      progressPercent: 52,
      status: "active",
      budgetTotal: 1500,
      riskLevel: "high",
    });
  });
});
