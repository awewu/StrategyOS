import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  mapAccountType,
  parseAccountMap,
  parseBalanceSheet,
  parseCapexForm,
  parseDateCell,
  parseDeptMap,
  parseFormMatrix,
  parseGlDetail,
  parseJeSheet,
  parsePviData,
  parseNum,
  parseOracleTb,
  parsePeriod,
} from "@/lib/finance/onestream";

describe("parseNum", () => {
  it("解析千分位/括号负数/货币符号", () => {
    assert.equal(parseNum("25,945,000.34"), 25945000.34);
    assert.equal(parseNum("(288.0)"), -288);
    assert.equal(parseNum(" $119.9 "), 119.9);
    assert.equal(parseNum("-1963.5"), -1963.5);
    assert.equal(parseNum(42), 42);
  });
  it("空值/占位符返回 null", () => {
    assert.equal(parseNum(""), null);
    assert.equal(parseNum("-"), null);
    assert.equal(parseNum("N/A"), null);
    assert.equal(parseNum(null), null);
    assert.equal(parseNum("abc"), null);
  });
});

describe("parsePeriod", () => {
  it("识别多种期间格式", () => {
    assert.equal(parsePeriod("Dec 2024"), "2024-12");
    assert.equal(parsePeriod("2024M1"), "2024-01");
    assert.equal(parsePeriod("2024M12"), "2024-12");
    assert.equal(parsePeriod("31-Dec-2024"), "2024-12");
    assert.equal(parsePeriod("2024-05"), "2024-05");
    assert.equal(parsePeriod("Top"), null);
  });
});

describe("parseDateCell", () => {
  it("识别 31-Dec-2024 与 6/22/14", () => {
    assert.equal(parseDateCell("31-Dec-2024")?.toISOString().slice(0, 10), "2024-12-31");
    assert.equal(parseDateCell("6/22/14")?.toISOString().slice(0, 10), "2014-06-22");
    assert.equal(parseDateCell(""), null);
  });
});

describe("mapAccountType", () => {
  it("中文账户类型映射", () => {
    assert.equal(mapAccountType("资产"), "asset");
    assert.equal(mapAccountType("负债"), "liability");
    assert.equal(mapAccountType("所有者权益"), "equity");
    assert.equal(mapAccountType("收入"), "revenue");
    assert.equal(mapAccountType("成本"), "cost");
    assert.equal(mapAccountType("费用"), "expense");
    assert.equal(mapAccountType(""), "other");
  });
});

describe("parseAccountMap", () => {
  const rows = [
    ["帐户", "说明", "帐户类型", "帐户类别", "生效日期", "失效日期", "控制帐户", "x", "x", "x", "x", "汇率类型", "合并到帐户", "合并到帐户说明", "货币折算方法", "中方会计科目", "美国会计科目", "美国会计科目描述"],
    ["1001001", "库存现金-付款", "资产", "", "6/22/14", "", "0", "", "", "", "", "买入", "", "", "无", "1001001", "111046", "CASH: CASH"],
    ["6601011", "销售费用-工资", "费用", "", "6/22/14", "", "0", "", "", "", "", "买入", "", "", "无", "6601011", "542306", "SELLING: WAGES"],
    ["1001001", "重复行应去重", "资产", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
  ];
  it("解析并去重", () => {
    const out = parseAccountMap(rows);
    assert.equal(out.length, 2);
    assert.equal(out[0].code, "1001001");
    assert.equal(out[0].accountType, "asset");
    assert.equal(out[0].usAccountCode, "111046");
    assert.equal(out[0].usAccountDesc, "CASH: CASH");
    assert.equal(out[0].effectiveFrom?.toISOString().slice(0, 10), "2014-06-22");
    assert.equal(out[1].accountType, "expense");
  });
  it("无表头时报错", () => {
    assert.throws(() => parseAccountMap([["a", "b"], ["1", "2"]]));
  });
});

describe("parseDeptMap", () => {
  const rows = [
    ["单位码", "单位码", "说明", "", "", "", "美国Mapping", "Department", "New P&L", "Level 0 - New #", "Dept Description"],
    ["102", "0102", "计划/采购部", "", "", "", "", "6MW", "Material/Warehousing", "659", "MATERIAL CONTROL"],
    ["103", "0103", "产品管理部", "", "", "", "", "4PD", "Product Management", "430", "Product Management"],
  ];
  it("解析部门映射", () => {
    const out = parseDeptMap(rows);
    assert.equal(out.length, 2);
    assert.equal(out[0].code, "102");
    assert.equal(out[0].usDeptCode, "6MW");
    assert.equal(out[0].plLevelCode, "659");
  });
});

describe("parseBalanceSheet", () => {
  const rows = [
    ["帐户", "帐户说明", "帐户单位 1", "单位码1描述", "帐户单位 2", "单位码2描述", "帐户单位 3", "单位码3描述", "帐户单位 4", "单位码4描述", "本币期初", "本币借方发生", "本币贷方发生", "本币期末"],
    ["1002001001", "银行存款-建行", "", "", "", "", "", "", "", "", "2566592.01", "25,945,000.34", "-21,825,369.80", "6,686,222.55"],
    ["", "跳过空科目行", "", "", "", "", "", "", "", "", "", "", "", ""],
  ];
  it("解析期初/借/贷/期末", () => {
    const out = parseBalanceSheet(rows, "2024-12");
    assert.equal(out.length, 1);
    assert.equal(out[0].accountCode, "1002001001");
    assert.equal(out[0].opening, 2566592.01);
    assert.equal(out[0].closing, 6686222.55);
    assert.equal(out[0].period, "2024-12");
  });
});

describe("parseOracleTb", () => {
  const rows = [
    ["31-Dec-2024", "590", "590", "1001001", "000", "000", "000", "LC01", "0000", "000", "-64520.71"],
    ["31-Dec-2024", "590", "590", "1001001", "000", "000", "000", "000", "0000", "000", "117788.36"],
    ["", "", "", "", "", "", "", "", "", "", ""],
  ];
  it("解析段格式 TB", () => {
    const out = parseOracleTb(rows);
    assert.equal(out.length, 2);
    assert.equal(out[0].period, "2024-12");
    assert.equal(out[0].dim4, "LC01");
    assert.equal(out[0].closing, -64520.71);
    assert.equal(out[0].asOfDate?.toISOString().slice(0, 10), "2024-12-31");
  });
});

describe("parseGlDetail", () => {
  const rows = [
    ["RCH", "2119", "31-Dec-2024", "CNY", "", "DR", "", "590", "590", "6602001", "0401", "000", "000", "000", "0000", "000", "613866.66", "0"],
    ["RCH", "2119", "31-Dec-2024", "CNY", "", "CR", "", "590", "590", "2242002006", "000", "000", "000", "000", "0000", "000", "0", "250586.7"],
    ["RCH", "2119", "31-Dec-2024", "CNY", "", "", "", "590", "590", "9999", "000", "000", "000", "000", "0000", "000", "0", "0"],
  ];
  it("解析借贷方向与金额，跳过零行", () => {
    const out = parseGlDetail(rows);
    assert.equal(out.length, 2);
    assert.equal(out[0].drcr, "dr");
    assert.equal(out[0].amount, 613866.66);
    assert.equal(out[1].drcr, "cr");
    assert.equal(out[1].amount, 250586.7);
    assert.equal(out[1].accountCode, "2242002006");
  });
});

describe("parseFormMatrix", () => {
  const rows = [
    ["", "Form_Units_Shipped", ""],
    ["", "", ""],
    ["", "Total Channel", "Default Wholesale"],
    ["", "Dec 2024", "Dec 2024"],
    ["Products:", "", ""],
    ["Boiler", "2", "2"],
    ["Residential WH", "1,992", "1,752"],
    ["Products Total", "1,994", "1,754"],
  ];
  it("行×列矩阵展开为事实，跳过 Total 与分组标题", () => {
    const out = parseFormMatrix(rows, { headerRowIndex: 2, periodRowIndex: 3 });
    assert.equal(out.length, 2); // Total Channel 列与 Products Total 行均被跳过
    const wholesale = out.filter((f) => f.dim2 === "Default Wholesale");
    assert.equal(wholesale.length, 2);
    assert.equal(wholesale[1].value, 1752);
    assert.ok(out.every((f) => f.period === "2024-12"));
    assert.ok(!out.some((f) => f.dim1 === "Products Total"));
  });
});

describe("parseJeSheet", () => {
  const header = [
    "Description", "CB#", "E#", "P#", "A#", "F#", "IC#", "UD1#", "UD2#", "UD3#", "UD4#", "UD5", "UD6#", "UD7#", "UD8#",
    " 2024M12 ", " 2024M1 (Load) ", "FX '24", " Current Month ", " 2024M1 (USD) ", " 2024M2 (USD) ", "Load",
  ];
  const rows = [
    header,
    // 逐月 USD 有值（预测型）
    ["Combi Boilers", "", "590", "New_Prod_Rev", "EndbalLoad", "", "", "None", "None", "Def_205", "None", "New2Yr", "", "", "", " -  ", "8,662.44", "7.00", " -  ", "8,662.44", "28,604.27", "USD"],
    // 仅当月 USD 有值（实际型），科目为数字
    ["Material Cost", "", "590", "530000", "EndbalLoad", "", "", "None", "100", "None", "None", "Volume", "", "", "", "(2,205,958.84)", " -  ", "7.00", "(315,136.98)", " -  ", " -  ", "Local"],
    // 全零行跳过
    ["Selling", "", "590", "540000", "EndbalLoad", "", "", "None", "None", "None", "None", "Inflation", "", "", "", " -  ", " -  ", "7.00", " -  ", " -  ", " -  ", "Local"],
  ];
  it("展开逐月 USD 列与当月列，维度落位", () => {
    const out = parseJeSheet(rows, "2024-12");
    assert.equal(out.length, 3);
    const monthly = out.filter((f) => f.metricCode === "New_Prod_Rev");
    assert.equal(monthly.length, 2);
    assert.equal(monthly[0].period, "2024-01");
    assert.equal(monthly[0].productCode, "Def_205");
    assert.equal(monthly[0].bridgeCode, "New2Yr");
    assert.equal(monthly[1].period, "2024-02");
    const current = out.find((f) => f.accountCode === "530000");
    assert.ok(current);
    assert.equal(current.period, "2024-12"); // 从 "2024M12" 表头推断
    assert.equal(current.amount, -315136.98);
    assert.equal(current.deptCode, "100");
    assert.equal(current.bridgeCode, "Volume");
    assert.equal(current.metricCode, null);
  });
  it("无表头时报错", () => {
    assert.throws(() => parseJeSheet([["a"], ["b"]], "2024-12"));
  });
});

describe("parsePviData", () => {
  const rows = [
    ["Business Unit", "Reporting Unit", "BU #", "BU & #", "RU #", "RU & #", "RU & BU#", "Product Name", "Trade / Intercompany", "Product Category", "Launch Date", "2024M1", "2024M2", "2024", "", "Product Category", "UD2"],
    ["Rheem US", "Rheem US - US WH", "1", "", "", "", "", "Odin Refresh ", "Trade", "Heatpump / Hybrid", "Jun-24", " $-   ", " $6,409.83 ", " $6,409.83 ", "", "", ""],
    ["De Jong", "", "24", "", "", "", "", "Speichermodul", "Trade", "Storage Tanks", "Feb-21", " $3.26 ", " $-   ", " $3.26 ", "", "", ""],
    ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
  ];
  it("按月展开，跳过年度合计列与零值，Launch Date 解析为期间", () => {
    const out = parsePviData(rows);
    assert.equal(out.length, 2);
    assert.equal(out[0].productName, "Odin Refresh");
    assert.equal(out[0].period, "2024-02");
    assert.equal(out[0].amount, 6409.83);
    assert.equal(out[0].launchPeriod, "2024-06");
    assert.equal(out[1].businessUnit, "De Jong");
    assert.equal(out[1].reportingUnit, "De Jong"); // Reporting Unit 缺失时回退 BU
    assert.equal(out[1].period, "2024-01");
  });
  it("无表头时报错", () => {
    assert.throws(() => parsePviData([["x"]]));
  });
});

describe("parseCapexForm", () => {
  const rows = [
    ["", "", "", "", "", "", "Form_CapEx", "", "", "", "", "", ""],
    ["", "", ""],
    ["", "Jan 2024", "Feb 2024", "Dec 2024"],
    ["", "YTD", "YTD", "YTD"],
    ["RHEEM (CHINA) WATER HEATER", "4,140", "2,638", "699,826"],
  ];
  it("按月展开 YTD 值", () => {
    const out = parseCapexForm(rows);
    assert.equal(out.length, 3);
    assert.equal(out[0].period, "2024-01");
    assert.equal(out[2].period, "2024-12");
    assert.equal(out[2].value, 699826);
  });
});
