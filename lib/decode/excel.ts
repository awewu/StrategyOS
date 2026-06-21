import * as XLSX from "xlsx";
import type { TrafficLight } from "@/lib/types/stratos";
import type { BscRowPayload, HoshinRowPayload } from "@/lib/decode/data-access";

const LIGHTS = new Set<TrafficLight>(["green", "yellow", "red"]);

function normHeader(h: unknown): string {
  return String(h ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

function parseLight(raw: unknown, fallback: TrafficLight = "yellow"): TrafficLight {
  const v = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (v === "绿" || v === "green" || v === "g") return "green";
  if (v === "黄" || v === "yellow" || v === "y") return "yellow";
  if (v === "红" || v === "red" || v === "r") return "red";
  return LIGHTS.has(v as TrafficLight) ? (v as TrafficLight) : fallback;
}

function splitOperating(raw: unknown): string[] {
  if (raw == null || raw === "") return [];
  return String(raw)
    .split(/[;；|\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseBool(raw: unknown): boolean {
  const v = String(raw ?? "").trim();
  return v === "1" || v === "是" || v === "Y" || v === "y" || v.toLowerCase() === "true";
}

type RowRecord = Record<string, unknown>;

function sheetToRecords(buffer: Buffer, sheetName?: string): RowRecord[] {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const name = sheetName && wb.SheetNames.includes(sheetName) ? sheetName : wb.SheetNames[0];
  if (!name) return [];
  const sheet = wb.Sheets[name];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json<RowRecord>(sheet, { defval: "" });
}

function pick(row: RowRecord, ...keys: string[]): string {
  const entries = Object.entries(row);
  for (const key of keys) {
    const nk = normHeader(key);
    const hit = entries.find(([k]) => normHeader(k) === nk || normHeader(k).includes(nk));
    if (hit && String(hit[1]).trim()) return String(hit[1]).trim();
  }
  return "";
}

export function parseBscExcel(buffer: Buffer): BscRowPayload[] {
  const records = sheetToRecords(buffer, "BSC");
  if (records.length === 0) {
    const all = sheetToRecords(buffer);
    if (all.length === 0) throw new Error("Excel 为空或无法读取工作表");
    return mapBscRecords(all);
  }
  return mapBscRecords(records);
}

function mapBscRecords(records: RowRecord[]): BscRowPayload[] {
  const rows = records
    .map((row) => {
      const dim = pick(row, "维度", "dim", "dimension");
      if (!dim) return null;
      return {
        dim,
        objective: pick(row, "战略目标", "objective", "目标"),
        mustWin: pick(row, "must-win", "mustwin", "必赢"),
        operating: splitOperating(pick(row, "运营指标", "operating", "领先指标")),
        mustNotFail: pick(row, "must-not-fail", "mustnotfail", "不可失败", "底线"),
        mustWinStatus: parseLight(pick(row, "must-win灯", "mustwin灯", "必赢灯", "must_win_status")),
        notFailStatus: parseLight(pick(row, "notfail灯", "not-fail灯", "底线灯", "not_fail_status")),
      } satisfies BscRowPayload;
    })
    .filter((r): r is BscRowPayload => r != null && Boolean(r.dim));

  if (rows.length === 0) throw new Error("未识别到 BSC 行 — 请使用模板表头（维度、战略目标…）");
  return rows;
}

export function parseHoshinExcel(buffer: Buffer): HoshinRowPayload[] {
  const records = sheetToRecords(buffer, "Hoshin");
  const source = records.length > 0 ? records : sheetToRecords(buffer);
  if (source.length === 0) throw new Error("Excel 为空或无法读取工作表");

  const rows = source
    .map((row, i) => {
      const label = pick(row, "条目", "label", "项目");
      const rowLabel = pick(row, "行标签", "row", "rowlabel", "行");
      const colLabel = pick(row, "列标签", "col", "collabel", "列");
      if (!label || !rowLabel || !colLabel) return null;
      return {
        id: `import-${i}`,
        rowLabel,
        colLabel,
        label,
        tti: pick(row, "tti", "时间"),
        okr: pick(row, "okr", "OKR"),
        action: pick(row, "行动", "action"),
        owner: pick(row, "owner", "负责人"),
        correlated: parseBool(pick(row, "关联", "correlated", "correlation")),
      };
    })
    .filter((r): r is HoshinRowPayload => r != null);

  if (rows.length === 0) throw new Error("未识别到 X-Matrix 行 — 请使用模板表头（行标签、列标签、条目…）");
  return rows;
}

export function buildBscTemplateWorkbook(): Buffer {
  const ws = XLSX.utils.aoa_to_sheet([
    ["维度", "战略目标", "Must-Win", "运营指标(分号分隔)", "Must-Not-Fail", "Must-Win灯", "NotFail灯"],
    ["财务", "投资驱动增长", "营收 CAGR ≥ 15%", "ROS 11.2%; EBITDA 884万", "Runway < 3 月", "yellow", "red"],
    ["客户", "酒店 1200 家", "NPS ≥ 45", "酒店签约 820/1200", "P0 段 coverage 缺失", "yellow", "yellow"],
  ]);
  ws["!cols"] = [{ wch: 8 }, { wch: 28 }, { wch: 22 }, { wch: 32 }, { wch: 24 }, { wch: 12 }, { wch: 12 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "BSC");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

export function buildHoshinTemplateWorkbook(): Buffer {
  const ws = XLSX.utils.aoa_to_sheet([
    ["行标签", "列标签", "条目", "TTI", "OKR", "行动", "Owner", "关联"],
    ["南 · 长期突破", "东 · 指标", "营收 CAGR", "12–24 月", "O-增长 · KR 营收 +20%", "SPBP 情景绑定", "CEO / CFO", "1"],
    ["西 · 年度突破", "北 · 改善项目", "V4 热泵", "12 月", "KR 首批 50 家渠道", "IC-04 产线决策", "热水 BU", "1"],
  ]);
  ws["!cols"] = [{ wch: 16 }, { wch: 14 }, { wch: 18 }, { wch: 10 }, { wch: 28 }, { wch: 22 }, { wch: 14 }, { wch: 6 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Hoshin");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

export function buildCombinedTemplateWorkbook(): Buffer {
  const bsc = XLSX.utils.aoa_to_sheet([
    ["维度", "战略目标", "Must-Win", "运营指标(分号分隔)", "Must-Not-Fail", "Must-Win灯", "NotFail灯"],
    ["财务", "", "", "", "", "yellow", "yellow"],
  ]);
  const hoshin = XLSX.utils.aoa_to_sheet([
    ["行标签", "列标签", "条目", "TTI", "OKR", "行动", "Owner", "关联"],
    ["南 · 长期突破", "东 · 指标", "", "", "", "", "", "0"],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, bsc, "BSC");
  XLSX.utils.book_append_sheet(wb, hoshin, "Hoshin");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
