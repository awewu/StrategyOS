import type { UsageLogRecord } from "@/lib/audit/types";

const CSV_COLUMNS = [
  "createdAt",
  "userEmail",
  "action",
  "resource",
  "ip",
  "userAgent",
  "prevHash",
  "hash",
] as const;

function csvCell(value: unknown): string {
  if (value == null) return "";
  const str = value instanceof Date ? value.toISOString() : String(value);
  // RFC 4180: quote when the value contains a comma, quote, or newline.
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Serialize audit rows to RFC-4180 CSV. Order is preserved (caller decides). */
export function serializeAuditCsv(rows: UsageLogRecord[]): string {
  const header = CSV_COLUMNS.join(",");
  const lines = rows.map((r) =>
    CSV_COLUMNS.map((col) => {
      if (col === "resource") return csvCell(r.resource);
      return csvCell((r as unknown as Record<string, unknown>)[col]);
    }).join(","),
  );
  return [header, ...lines].join("\r\n");
}
