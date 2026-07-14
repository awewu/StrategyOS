/**
 * Sheet 导入 · 差异引擎(T4-P3,纯函数)
 *
 * 输入:预检产出的 records + DB 现状(同字段形态),按业务键对齐,
 * 输出:每条记录 new / update / unchanged 及字段级变更明细。
 * 不触碰 DB,不含 sheet 语义 — 业务键由调用方(SHEET_COMMIT_KEYS)提供。
 */

export type DiffStatus = "new" | "update" | "unchanged";

export interface FieldChange {
  field: string;
  before: unknown;
  after: unknown;
}

export interface RecordDiff {
  key: string;
  status: DiffStatus;
  record: Record<string, unknown>;
  changes: FieldChange[];
}

export interface DiffSummary {
  created: number;
  updated: number;
  unchanged: number;
  rows: RecordDiff[];
}

/** 业务键提取:多字段拼接,任一缺失返回 null(该行无法对齐,视为 new) */
export function recordKey(record: Record<string, unknown>, keyFields: string[]): string | null {
  const parts: string[] = [];
  for (const f of keyFields) {
    const v = record[f];
    if (v === undefined || v === null || String(v).trim() === "") return null;
    parts.push(String(v).trim());
  }
  return parts.join("\u241f"); // ␟ 单元分隔符,避免值内串拼撞键
}

function valueEqual(a: unknown, b: unknown): boolean {
  if (a === undefined || a === null) return b === undefined || b === null;
  if (b === undefined || b === null) return false;
  if (typeof a === "number" || typeof b === "number") {
    const na = Number(a);
    const nb = Number(b);
    if (Number.isFinite(na) && Number.isFinite(nb)) return Math.abs(na - nb) < 1e-9;
  }
  return String(a).trim() === String(b).trim();
}

/**
 * 对齐 records 与 existing(key → 现状记录),产出 diff。
 * 仅比较 record 里出现的字段(Excel 未提供的列不算变更,入库时保留 DB 现值)。
 */
export function buildSheetDiff(
  records: Record<string, unknown>[],
  existingByKey: Map<string, Record<string, unknown>>,
  keyFields: string[],
): DiffSummary {
  const rows: RecordDiff[] = [];
  let created = 0;
  let updated = 0;
  let unchanged = 0;

  for (const record of records) {
    const key = recordKey(record, keyFields);
    const existing = key === null ? undefined : existingByKey.get(key);

    if (key === null || !existing) {
      created += 1;
      rows.push({ key: key ?? "(无键)", status: "new", record, changes: [] });
      continue;
    }

    const changes: FieldChange[] = [];
    for (const [field, after] of Object.entries(record)) {
      if (keyFields.includes(field)) continue;
      if (after === undefined) continue;
      const before = existing[field];
      if (!valueEqual(before, after)) changes.push({ field, before: before ?? null, after });
    }

    if (changes.length === 0) {
      unchanged += 1;
      rows.push({ key, status: "unchanged", record, changes: [] });
    } else {
      updated += 1;
      rows.push({ key, status: "update", record, changes });
    }
  }

  return { created, updated, unchanged, rows };
}

/** sheetType → 业务键字段(与 commit 层 upsert 键一致) */
export const SHEET_COMMIT_KEYS: Record<string, string[]> = {
  finance: ["period"],
  assumptions: ["code"],
  projects: ["code"],
};
