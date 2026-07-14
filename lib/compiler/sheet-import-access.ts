/**
 * Sheet 导入 · 画像持久化与 Excel 解析(T4-P2)。
 * 引擎逻辑全部在 sheet-profiles.ts(纯函数);本文件只做 DB CRUD 与 xlsx 读取。
 */
import { prisma, safeDbQuery } from "@/lib/db";
import type { ColumnMap } from "./sheet-profiles";

export interface SheetProfileRow {
  id: string;
  sheetType: string;
  name: string;
  columnMap: ColumnMap;
  updatedAt: string;
}

export async function listSheetProfiles(sheetType?: string): Promise<SheetProfileRow[]> {
  return safeDbQuery(async () => {
    const rows = await prisma.sheetMappingProfile.findMany({
      where: sheetType ? { sheetType } : undefined,
      orderBy: { updatedAt: "desc" },
    });
    return rows.map((r) => ({
      id: r.id,
      sheetType: r.sheetType,
      name: r.name,
      columnMap: r.columnMap as ColumnMap,
      updatedAt: r.updatedAt.toISOString(),
    }));
  }, []);
}

export async function saveSheetProfile(
  sheetType: string,
  name: string,
  columnMap: ColumnMap,
): Promise<SheetProfileRow> {
  const row = await prisma.sheetMappingProfile.upsert({
    where: { sheetType_name: { sheetType, name } },
    create: { sheetType, name, columnMap },
    update: { columnMap },
  });
  return {
    id: row.id,
    sheetType: row.sheetType,
    name: row.name,
    columnMap: row.columnMap as ColumnMap,
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** 读取 xlsx 首个工作表 → { headers, rows } (rows 以表头为 key) */
export async function readSheetRows(
  buffer: Buffer,
): Promise<{ headers: string[]; rows: Record<string, unknown>[] }> {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(buffer, { type: "buffer" });
  const name = wb.SheetNames[0];
  if (!name) return { headers: [], rows: [] };
  const sheet = wb.Sheets[name];
  const aoa = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });
  const headerRow = (aoa[0] ?? []).map((h) => String(h ?? "").trim());
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  return { headers: headerRow.filter(Boolean), rows };
}
