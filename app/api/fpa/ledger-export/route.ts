import { requireApiMinLevel } from "@/lib/auth/api-guard";
import { LEDGER_SOURCES, type LedgerSourceKind } from "@/lib/finance/ledger-import-access";
import { dbAvailable, prisma } from "@/lib/db";

/** 把当前已入库的总账数据按来源类型导出为 Excel（备份 / 离线核对）。 */
async function fetchRows(kind: LedgerSourceKind): Promise<Record<string, unknown>[]> {
  switch (kind) {
    case "account_map":
      return prisma.ledgerAccount.findMany({ orderBy: { code: "asc" } });
    case "dept_map":
      return prisma.ledgerDepartment.findMany({ orderBy: { code: "asc" } });
    case "trial_balance":
      return prisma.ledgerTbLine.findMany({ orderBy: [{ period: "asc" }, { accountCode: "asc" }], take: 50000 });
    case "gl_detail":
      return prisma.ledgerGlLine.findMany({ orderBy: [{ period: "asc" }, { journalNo: "asc" }], take: 50000 });
    case "form_headcount":
      return prisma.opsMetricFact.findMany({ where: { metricType: "headcount" }, orderBy: { period: "asc" } });
    case "form_units":
      return prisma.opsMetricFact.findMany({ where: { metricType: "units_shipped" }, orderBy: { period: "asc" } });
    case "form_capex":
      return prisma.opsMetricFact.findMany({ where: { metricType: "capex" }, orderBy: { period: "asc" } });
    case "fact_entry":
      return prisma.finFactEntry.findMany({ orderBy: { period: "asc" }, take: 50000 });
    case "pvi_sales":
      return prisma.pviSalesFact.findMany({ orderBy: { period: "asc" }, take: 50000 });
    default:
      return [];
  }
}

function normalize(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  return rows.map((r) => {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(r)) {
      if (k === "id" || k === "batchId" || k === "accountId" || k === "scenarioId") continue;
      if (v instanceof Date) out[k] = v.toISOString().slice(0, 10);
      else if (v && typeof v === "object" && "toNumber" in (v as object)) out[k] = Number(v);
      else out[k] = v;
    }
    return out;
  });
}

export async function GET(req: Request) {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;

  const url = new URL(req.url);
  const kind = url.searchParams.get("kind") as LedgerSourceKind | null;
  const spec = kind ? LEDGER_SOURCES[kind] : null;
  if (!kind || !spec) {
    return new Response(JSON.stringify({ error: "缺少或非法 kind 参数" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  if (!(await dbAvailable())) {
    return new Response(JSON.stringify({ error: "数据库不可用" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const XLSX = await import("xlsx");
  const rows = normalize(await fetchRows(kind));
  const ws = rows.length > 0 ? XLSX.utils.json_to_sheet(rows) : XLSX.utils.aoa_to_sheet([["（暂无数据）"]]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, kind.slice(0, 31));
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  const fname = `ledger_${kind}_${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new Response(new Uint8Array(buf), {
    status: 200,
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": `attachment; filename="${fname}"`,
    },
  });
}
