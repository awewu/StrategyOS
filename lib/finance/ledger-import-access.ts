/**
 * Ledger Hub · 网页导入访问层
 *
 * 把 scripts/import-onestream.ts 的 CLI 管道搬到网页：上传 → 预览 → 确认入库。
 * 解析逻辑仍复用 lib/finance/onestream.ts 的纯函数；本文件负责工作表定位、
 * 预览采样、幂等批次生命周期与 DB 写入。
 */
import crypto from "node:crypto";
import type { OpsMetricType } from "@prisma/client";
import { dbAvailable, prisma } from "@/lib/db";
import {
  parseAccountMap,
  parseBalanceSheet,
  parseCapexForm,
  parseDeptMap,
  parseFormMatrix,
  parseGlDetail,
  parseJeSheet,
  parseOracleTb,
  parsePviData,
  type Row,
} from "@/lib/finance/onestream";

/** 可导入的 9 类来源（不含 manual_ops/manual_pvi —— 后者仅用于手工调整批次溯源）。 */
export type LedgerSourceKind =
  | "account_map"
  | "dept_map"
  | "trial_balance"
  | "gl_detail"
  | "form_headcount"
  | "form_units"
  | "form_capex"
  | "fact_entry"
  | "pvi_sales";

export type PreviewResult = {
  sheetName: string;
  rowCount: number;
  columns: string[];
  sample: Record<string, unknown>[];
  issues: string[];
};

export type CommitResult = {
  batchId: string | null;
  status: "imported" | "skipped" | "failed";
  rowCount: number;
  message: string;
};

/** JE 装载页 → 情景映射（与脚本一致）。 */
const JE_SCENARIO: Record<string, string> = {
  "JE Actual": "ActualAt2024BudgetRate",
  "JE Forecast": "mgmtadjDecFcst",
};

type SourceSpec = {
  kind: LedgerSourceKind;
  label: string;
  /** 是否需要用户指定期间（GL/TB/事实类）。映射类不需要。 */
  needsPeriod: boolean;
  /** 建议的工作表名/前缀，用于 UI 提示。 */
  sheetHint: string;
  /** 从工作簿工作表名列表中解析出目标工作表。 */
  resolveSheet(sheetNames: string[], preferred?: string): string | null;
  /** 解析为通用记录数组（供预览与入库共用）。 */
  parse(rows: Row[], period: string, sheetName: string): Record<string, unknown>[];
};

const FIRST = (names: string[]) => names[0] ?? null;
const exact = (target: string) => (names: string[]) =>
  names.find((n) => n.toLowerCase() === target.toLowerCase()) ?? null;
const prefix = (p: string) => (names: string[]) =>
  names.find((n) => n.toUpperCase().startsWith(p.toUpperCase())) ?? null;

export const LEDGER_SOURCES: Record<LedgerSourceKind, SourceSpec> = {
  account_map: {
    kind: "account_map",
    label: "科目映射（中→美）",
    needsPeriod: false,
    sheetHint: "工作表：Acct Mapping",
    resolveSheet: (n) => exact("Acct Mapping")(n) ?? FIRST(n),
    parse: (rows) => parseAccountMap(rows) as unknown as Record<string, unknown>[],
  },
  dept_map: {
    kind: "dept_map",
    label: "部门映射（单位码→US）",
    needsPeriod: false,
    sheetHint: "工作表：Department Mapping",
    resolveSheet: (n) => exact("Department Mapping")(n) ?? FIRST(n),
    parse: (rows) => parseDeptMap(rows) as unknown as Record<string, unknown>[],
  },
  trial_balance: {
    kind: "trial_balance",
    label: "试算平衡 / 科目余额",
    needsPeriod: true,
    sheetHint: "工作表：Sheet1（本币余额）或 TB_ 开头（Oracle 段）",
    resolveSheet: (n, preferred) =>
      (preferred && n.includes(preferred) ? preferred : null) ??
      prefix("TB_")(n) ??
      exact("Sheet1")(n) ??
      FIRST(n),
    parse: (rows, period, sheetName) =>
      (sheetName.toUpperCase().startsWith("TB_")
        ? parseOracleTb(rows)
        : parseBalanceSheet(rows, period)) as unknown as Record<string, unknown>[],
  },
  gl_detail: {
    kind: "gl_detail",
    label: "GL 日记账明细",
    needsPeriod: true,
    sheetHint: "工作表：GL_ 开头",
    resolveSheet: (n, preferred) =>
      (preferred && n.includes(preferred) ? preferred : null) ?? prefix("GL_")(n) ?? FIRST(n),
    parse: (rows) => parseGlDetail(rows) as unknown as Record<string, unknown>[],
  },
  form_headcount: {
    kind: "form_headcount",
    label: "表单 · 人头",
    needsPeriod: false,
    sheetHint: "Headcount 导出表单",
    resolveSheet: (n) => FIRST(n),
    parse: (rows) =>
      parseFormMatrix(rows, { headerRowIndex: 2, periodRowIndex: 3 }) as unknown as Record<string, unknown>[],
  },
  form_units: {
    kind: "form_units",
    label: "表单 · 发货台数",
    needsPeriod: false,
    sheetHint: "Units Shipped 导出表单",
    resolveSheet: (n) => FIRST(n),
    parse: (rows) =>
      parseFormMatrix(rows, { headerRowIndex: 2, periodRowIndex: 3 }) as unknown as Record<string, unknown>[],
  },
  form_capex: {
    kind: "form_capex",
    label: "表单 · CapEx",
    needsPeriod: false,
    sheetHint: "CapEx 导出表单",
    resolveSheet: (n) => FIRST(n),
    parse: (rows) => parseCapexForm(rows) as unknown as Record<string, unknown>[],
  },
  fact_entry: {
    kind: "fact_entry",
    label: "情景事实（JE 装载页）",
    needsPeriod: true,
    sheetHint: "工作表：JE Actual 或 JE Forecast",
    resolveSheet: (n, preferred) =>
      (preferred && n.includes(preferred) ? preferred : null) ??
      exact("JE Actual")(n) ??
      exact("JE Forecast")(n) ??
      FIRST(n),
    parse: (rows, period) => parseJeSheet(rows, period) as unknown as Record<string, unknown>[],
  },
  pvi_sales: {
    kind: "pvi_sales",
    label: "PVI 新品活力",
    needsPeriod: true,
    sheetHint: "工作表：PVI Data",
    resolveSheet: (n) => exact("PVI Data")(n) ?? FIRST(n),
    parse: (rows) => parsePviData(rows) as unknown as Record<string, unknown>[],
  },
};

export function listLedgerSources(): { kind: LedgerSourceKind; label: string; needsPeriod: boolean; sheetHint: string }[] {
  return Object.values(LEDGER_SOURCES).map((s) => ({
    kind: s.kind,
    label: s.label,
    needsPeriod: s.needsPeriod,
    sheetHint: s.sheetHint,
  }));
}

async function readWorkbook(buffer: Buffer) {
  const XLSX = await import("xlsx");
  return XLSX.read(buffer, { type: "buffer", cellStyles: false });
}

async function readRowsFromBuffer(buffer: Buffer, sheetName: string): Promise<Row[]> {
  const XLSX = await import("xlsx");
  const wb = await readWorkbook(buffer);
  const ws = wb.Sheets[sheetName];
  if (!ws) throw new Error(`工作簿缺少工作表「${sheetName}」`);
  return XLSX.utils.sheet_to_json<Row>(ws, { header: 1, defval: "", raw: false });
}

/** 把 Date / Decimal 转成可序列化值，供预览 JSON 返回。 */
function serialize(records: Record<string, unknown>[]): Record<string, unknown>[] {
  return records.map((r) => {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(r)) {
      out[k] = v instanceof Date ? v.toISOString().slice(0, 10) : v;
    }
    return out;
  });
}

export function contentHash(buffer: Buffer, sheetName: string): string {
  const h = crypto.createHash("sha256");
  h.update(buffer);
  h.update(sheetName);
  return h.digest("hex");
}

export async function previewLedgerImport(
  kind: LedgerSourceKind,
  buffer: Buffer,
  period: string,
  preferredSheet?: string,
): Promise<PreviewResult> {
  const spec = LEDGER_SOURCES[kind];
  if (!spec) throw new Error(`未知来源类型：${kind}`);
  const wb = await readWorkbook(buffer);
  const sheetName = spec.resolveSheet(wb.SheetNames, preferredSheet);
  if (!sheetName) throw new Error("无法定位目标工作表");
  const rows = await readRowsFromBuffer(buffer, sheetName);
  const records = spec.parse(rows, period, sheetName);
  const issues: string[] = [];
  if (records.length === 0) issues.push("解析后 0 行 — 检查工作表格式或表头行");
  const columns = records.length > 0 ? Object.keys(records[0]) : [];
  return {
    sheetName,
    rowCount: records.length,
    columns,
    sample: serialize(records.slice(0, 20)),
    issues,
  };
}

/** 幂等批次：同 hash 且已入库则跳过。 */
export async function commitLedgerImport(
  kind: LedgerSourceKind,
  buffer: Buffer,
  fileName: string,
  period: string,
  importedBy: string,
  preferredSheet?: string,
): Promise<CommitResult> {
  if (!(await dbAvailable())) {
    return { batchId: null, status: "failed", rowCount: 0, message: "数据库不可用" };
  }
  const spec = LEDGER_SOURCES[kind];
  if (!spec) throw new Error(`未知来源类型：${kind}`);
  const wb = await readWorkbook(buffer);
  const sheetName = spec.resolveSheet(wb.SheetNames, preferredSheet);
  if (!sheetName) throw new Error("无法定位目标工作表");

  const hash = contentHash(buffer, sheetName);
  const existing = await prisma.finImportBatch.findFirst({
    where: { contentHash: hash, sourceType: kind, status: "imported" },
  });
  if (existing) {
    return {
      batchId: existing.id,
      status: "skipped",
      rowCount: existing.rowCount,
      message: `同内容已导入（批次 ${existing.id.slice(0, 8)}），已跳过`,
    };
  }

  const batch = await prisma.finImportBatch.create({
    data: {
      sourceType: kind,
      fileName,
      sheetName,
      period: spec.needsPeriod ? period : null,
      contentHash: hash,
      importedBy,
    },
  });

  try {
    const rows = await readRowsFromBuffer(buffer, sheetName);
    const records = spec.parse(rows, period, sheetName);
    const rowCount = await writeRecords(kind, records, batch.id, period, sheetName);
    await prisma.finImportBatch.update({
      where: { id: batch.id },
      data: { rowCount, status: "imported" },
    });
    return { batchId: batch.id, status: "imported", rowCount, message: `已入库 ${rowCount} 行` };
  } catch (err) {
    await prisma.finImportBatch.update({
      where: { id: batch.id },
      data: { status: "failed", errorText: String(err).slice(0, 500) },
    });
    return {
      batchId: batch.id,
      status: "failed",
      rowCount: 0,
      message: err instanceof Error ? err.message : "入库失败",
    };
  }
}

const FORM_META: Record<string, { metricType: OpsMetricType; unit: string }> = {
  form_headcount: { metricType: "headcount", unit: "人" },
  form_units: { metricType: "units_shipped", unit: "台" },
  form_capex: { metricType: "capex", unit: "USD" },
};

async function accountCodeToId(): Promise<Map<string, string>> {
  const accounts = await prisma.ledgerAccount.findMany({ select: { id: true, code: true } });
  return new Map(accounts.map((a) => [a.code, a.id]));
}

/** 按来源类型把已解析记录写入对应表，返回写入行数。 */
async function writeRecords(
  kind: LedgerSourceKind,
  records: Record<string, unknown>[],
  batchId: string,
  period: string,
  sheetName: string,
): Promise<number> {
  switch (kind) {
    case "account_map": {
      for (const r of records) {
        const row = r as { code: string };
        await prisma.ledgerAccount.upsert({ where: { code: row.code }, create: r as never, update: r as never });
      }
      return records.length;
    }
    case "dept_map": {
      for (const r of records) {
        const row = r as { code: string };
        await prisma.ledgerDepartment.upsert({ where: { code: row.code }, create: r as never, update: r as never });
      }
      return records.length;
    }
    case "trial_balance": {
      const codeToId = await accountCodeToId();
      await prisma.ledgerTbLine.createMany({
        data: records.map((r) => ({
          ...(r as object),
          batchId,
          accountId: codeToId.get((r as { accountCode: string }).accountCode) ?? null,
        })) as never,
      });
      return records.length;
    }
    case "gl_detail": {
      const codeToId = await accountCodeToId();
      await prisma.ledgerGlLine.createMany({
        data: records.map((r) => ({
          ...(r as object),
          batchId,
          accountId: codeToId.get((r as { accountCode: string }).accountCode) ?? null,
        })) as never,
      });
      return records.length;
    }
    case "form_headcount":
    case "form_units":
    case "form_capex": {
      const meta = FORM_META[kind];
      await prisma.opsMetricFact.createMany({
        data: records.map((r) => ({ ...(r as object), batchId, metricType: meta.metricType, unit: meta.unit })) as never,
      });
      return records.length;
    }
    case "fact_entry": {
      const scenarioCode = JE_SCENARIO[sheetName];
      if (!scenarioCode) throw new Error(`工作表「${sheetName}」未映射到情景（需 JE Actual / JE Forecast）`);
      const scenario = await prisma.finScenario.findUnique({ where: { code: scenarioCode } });
      if (!scenario) throw new Error(`情景 ${scenarioCode} 不存在（先在预算/情景基线中建立）`);
      await prisma.finFactEntry.createMany({
        data: records.map((r) => ({ ...(r as object), batchId, scenarioId: scenario.id, entityCode: "5RC" })) as never,
      });
      return records.length;
    }
    case "pvi_sales": {
      await prisma.pviSalesFact.createMany({
        data: records.map((r) => ({ ...(r as object), batchId })) as never,
      });
      return records.length;
    }
    default:
      throw new Error(`未处理来源类型：${kind as string}（period ${period}）`);
  }
}
