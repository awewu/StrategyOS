/**
 * Sheet 列映射画像引擎（T4 导入管道 · P1）
 *
 * 原则与创新底座一致:内核纯函数不含任何具体列名/公司语义,
 * 全部取值来自 SheetSpec(字段规格)与 SheetMappingProfile(列映射,存 DB)。
 * 换 Excel 模板 = 改一行 profile 数据,代码零改动。
 *
 * 流程:
 *   guessColumnMap(headers, spec)   首次导入按表头相似度猜映射,人确认后存 profile
 *   applyProfile(rows, spec, map)   每月套用:映射 + 类型转换 + 预检 issues
 */

export type SheetFieldType = "string" | "number" | "enum";

export interface SheetFieldSpec {
  key: string;
  label: string;
  type: SheetFieldType;
  required?: boolean;
  /** 表头别名(猜映射用,含常见中英文写法) */
  aliases?: string[];
  /** enum 合法值 */
  enumValues?: string[];
  /** 单元格值 → enum 值的别名映射(如 "进行中"→"active") */
  enumAliases?: Record<string, string>;
}

export interface SheetSpec {
  sheetType: string;
  label: string;
  fields: SheetFieldSpec[];
}

/** field key → 源表头名 */
export type ColumnMap = Record<string, string>;

export interface ImportIssue {
  row: number;
  field?: string;
  severity: "error" | "warning";
  message: string;
}

export interface ApplyResult {
  records: Record<string, unknown>[];
  issues: ImportIssue[];
  /** 有 error 的行数(这些行不应入库) */
  errorRows: number;
}

function norm(s: string): string {
  return s.replace(/[\s()（）:：·・\-_/]/g, "").toLowerCase();
}

/** 按表头相似度猜映射:精确 label > 别名 > 包含关系 */
export function guessColumnMap(headers: string[], spec: SheetSpec): ColumnMap {
  const map: ColumnMap = {};
  const normalized = headers.map((h) => ({ raw: h, n: norm(h) }));

  for (const field of spec.fields) {
    const candidates = [field.label, field.key, ...(field.aliases ?? [])].map(norm);
    let hit = normalized.find((h) => candidates.includes(h.n));
    if (!hit) {
      hit = normalized.find((h) => candidates.some((c) => c.length >= 2 && (h.n.includes(c) || c.includes(h.n))));
    }
    if (hit) map[field.key] = hit.raw;
  }
  return map;
}

/** 数值解析:容忍千分位逗号、全角、"万"后缀(不换算,仅剥离)、% 后缀 */
export function parseNumberCell(value: unknown): number | undefined {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value !== "string") return undefined;
  const cleaned = value
    .replace(/[,，\s]/g, "")
    .replace(/[％%]$/, "")
    .replace(/万元?$/, "");
  if (cleaned === "") return undefined;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : undefined;
}

function resolveEnum(field: SheetFieldSpec, raw: string): string | undefined {
  if (field.enumValues?.includes(raw)) return raw;
  const alias = field.enumAliases?.[raw] ?? field.enumAliases?.[raw.trim()];
  if (alias && field.enumValues?.includes(alias)) return alias;
  return undefined;
}

export function applyProfile(
  rows: Record<string, unknown>[],
  spec: SheetSpec,
  columnMap: ColumnMap,
): ApplyResult {
  const issues: ImportIssue[] = [];
  const records: Record<string, unknown>[] = [];
  const rowsWithError = new Set<number>();

  // 映射完整性预检(行无关)
  for (const field of spec.fields) {
    if (field.required && !columnMap[field.key]) {
      issues.push({ row: 0, field: field.key, severity: "error", message: `必填字段「${field.label}」未映射到任何列` });
    }
  }

  rows.forEach((row, idx) => {
    const rowNo = idx + 1;
    const record: Record<string, unknown> = {};
    let empty = true;

    for (const field of spec.fields) {
      const header = columnMap[field.key];
      const raw = header ? row[header] : undefined;
      const rawStr = raw === undefined || raw === null ? "" : String(raw).trim();

      if (rawStr === "") {
        if (field.required) {
          issues.push({ row: rowNo, field: field.key, severity: "error", message: `「${field.label}」为空` });
          rowsWithError.add(rowNo);
        }
        continue;
      }
      empty = false;

      if (field.type === "number") {
        const n = parseNumberCell(raw);
        if (n === undefined) {
          issues.push({ row: rowNo, field: field.key, severity: "error", message: `「${field.label}」不是数字:${rawStr}` });
          rowsWithError.add(rowNo);
        } else {
          record[field.key] = n;
        }
      } else if (field.type === "enum") {
        const v = resolveEnum(field, rawStr);
        if (v === undefined) {
          issues.push({
            row: rowNo,
            field: field.key,
            severity: "error",
            message: `「${field.label}」值「${rawStr}」不在合法枚举(${(field.enumValues ?? []).join("/")})且无别名映射`,
          });
          rowsWithError.add(rowNo);
        } else {
          record[field.key] = v;
        }
      } else {
        record[field.key] = rawStr;
      }
    }

    if (empty) {
      issues.push({ row: rowNo, severity: "warning", message: "空行,已跳过" });
      return;
    }
    records.push(record);
  });

  return { records, issues, errorRows: rowsWithError.size };
}

// ————————————————————————————————————————————
// 字段规格注册表(对应 Blueprint §12 Sheet 清单;可持续扩展)
// ————————————————————————————————————————————

const CYNEFIN_ENUM: Pick<SheetFieldSpec, "enumValues" | "enumAliases"> = {
  enumValues: ["clear", "complicated", "complex", "chaotic"],
  enumAliases: { 清晰: "clear", 繁杂: "complicated", 复杂: "complex", 混乱: "chaotic" },
};

export const SHEET_SPECS: Record<string, SheetSpec> = {
  finance: {
    sheetType: "finance",
    label: "Sheet1 财务 B-A-F",
    fields: [
      { key: "period", label: "周期", type: "string", required: true, aliases: ["期间", "period", "财年"] },
      { key: "revenueBudget", label: "营收预算", type: "number", required: true, aliases: ["收入预算", "revenue budget"] },
      { key: "revenueActual", label: "营收实际", type: "number", aliases: ["收入实际", "revenue actual"] },
      { key: "revenueForecast", label: "营收预测", type: "number", aliases: ["收入预测", "revenue forecast"] },
      { key: "profitBudget", label: "利润预算", type: "number", aliases: ["profit budget"] },
      { key: "profitActual", label: "利润实际", type: "number", aliases: ["profit actual"] },
      { key: "profitForecast", label: "利润预测", type: "number", aliases: ["profit forecast"] },
      { key: "cashRunwayMonths", label: "现金 Runway", type: "number", aliases: ["runway", "现金跑道", "runway月数"] },
    ],
  },
  assumptions: {
    sheetType: "assumptions",
    label: "Sheet5 假设 Hx",
    fields: [
      { key: "code", label: "编号", type: "string", required: true, aliases: ["假设编号", "code", "hx"] },
      { key: "content", label: "假设内容", type: "string", required: true, aliases: ["内容", "假设", "statement"] },
      { key: "cynefinDomain", label: "Cynefin 域", type: "enum", aliases: ["域", "cynefin"], ...CYNEFIN_ENUM },
      {
        key: "result",
        label: "验证结果",
        type: "enum",
        aliases: ["结果", "状态", "result"],
        enumValues: ["pending", "validated", "failed"],
        enumAliases: { 待验证: "pending", 验证中: "pending", 成立: "validated", 已验证: "validated", 证伪: "failed", 不成立: "failed" },
      },
    ],
  },
  projects: {
    sheetType: "projects",
    label: "Sheet3 项目群 Vx",
    fields: [
      { key: "code", label: "项目编号", type: "string", required: true, aliases: ["编号", "vx", "code"] },
      { key: "name", label: "项目名称", type: "string", required: true, aliases: ["名称", "项目", "name"] },
      { key: "progressPercent", label: "进度", type: "number", aliases: ["进度%", "progress", "完成度"] },
      {
        key: "status",
        label: "状态",
        type: "enum",
        aliases: ["项目状态", "status"],
        enumValues: ["active", "completed", "paused"],
        enumAliases: { 进行中: "active", 进行: "active", 已完成: "completed", 完成: "completed", 暂停: "paused", 挂起: "paused" },
      },
      { key: "budgetTotal", label: "预算总额", type: "number", aliases: ["总预算", "budget"] },
      { key: "budgetSpent", label: "已用预算", type: "number", aliases: ["已花费", "spent"] },
      {
        key: "riskLevel",
        label: "风险",
        type: "enum",
        aliases: ["风险等级", "risk"],
        enumValues: ["none", "low", "medium", "high"],
        enumAliases: { 无: "none", 低: "low", 中: "medium", 高: "high" },
      },
      { key: "owner", label: "负责人", type: "string", aliases: ["owner", "责任人"] },
    ],
  },
};
