import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildBscTemplateWorkbook, parseBscExcel, parseHoshinExcel, buildHoshinTemplateWorkbook } from "@/lib/decode/excel";

describe("decode excel", () => {
  it("parses BSC template workbook", () => {
    const buf = buildBscTemplateWorkbook();
    const rows = parseBscExcel(buf);
    assert.ok(rows.length >= 2);
    assert.equal(rows[0]!.dim, "财务");
    assert.ok(rows[0]!.operating.length >= 1);
  });

  it("parses Hoshin template workbook", () => {
    const buf = buildHoshinTemplateWorkbook();
    const rows = parseHoshinExcel(buf);
    assert.ok(rows.length >= 2);
    assert.match(rows[0]!.label, /CAGR|营收/);
  });
});
