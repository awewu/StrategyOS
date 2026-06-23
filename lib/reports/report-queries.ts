import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getReportParseStatus, type ReportParseEngine } from "@/lib/reports/parse-status";
import { parseMonthlyPulse } from "@/lib/stratos/report-agent";

export const DEFAULT_REPORT_PAGE = 1;
export const DEFAULT_REPORT_PAGE_SIZE = 10;
export const MAX_REPORT_PAGE_SIZE = 50;

export type ReportFilters = {
  orgUnitId?: string;
  reportType?: string;
  period?: string;
  approval?: string;
};

export type ReportPagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
};

export type ReportListResult = {
  rows: ReportListRow[];
  pagination: ReportPagination;
};

export type ReportListRow = {
  id: string;
  title: string;
  reportType: string;
  period: string;
  approvalStatus: string;
  uploadedAt: string;
  orgUnit: { id: string; name: string; level: string } | null;
  fileOrigName: string | null;
  fileSizeBytes: number | null;
  hasParsed: boolean;
  parseEngine: ReportParseEngine;
  hasSignals: boolean;
  parseWarning: string | null;
  textExtracted: boolean;
  signalCount: number;
};

export type ReportDetail = ReportListRow & {
  rawContent: string | null;
  parsedJson: Prisma.JsonValue | null;
  filePath: string | null;
  fileMime: string | null;
  monthlyPulse: {
    oneLiner: string;
    offTrackKr?: string;
    needHelp?: string;
  } | null;
};

type ScopeWhere = { orgUnitId?: { in: string[] } };

export function normalizeReportPagination(input: {
  page?: string | number | null;
  pageSize?: string | number | null;
  total?: number;
}): ReportPagination {
  const rawPage = Number(input.page ?? DEFAULT_REPORT_PAGE);
  const rawPageSize = Number(input.pageSize ?? DEFAULT_REPORT_PAGE_SIZE);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : DEFAULT_REPORT_PAGE;
  const requestedPageSize =
    Number.isFinite(rawPageSize) && rawPageSize > 0 ? Math.floor(rawPageSize) : DEFAULT_REPORT_PAGE_SIZE;
  const pageSize = Math.min(requestedPageSize, MAX_REPORT_PAGE_SIZE);
  const total = Math.max(0, Math.floor(input.total ?? 0));
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    page,
    pageSize,
    total,
    totalPages,
    hasPrev: page > 1,
    hasNext: page < totalPages,
  };
}

export function reportPaginationOffset(pagination: Pick<ReportPagination, "page" | "pageSize">): number {
  return (pagination.page - 1) * pagination.pageSize;
}

export function buildReportWhere(filters: ReportFilters, scopeWhere: ScopeWhere = {}): Prisma.ReportWhereInput {
  return {
    ...scopeWhere,
    ...(filters.orgUnitId ? { orgUnitId: filters.orgUnitId } : {}),
    ...(filters.reportType ? { reportType: filters.reportType as never } : {}),
    ...(filters.period ? { period: { startsWith: filters.period } } : {}),
    ...(filters.approval ? { approvalStatus: filters.approval as never } : {}),
  };
}

function mapListRow(row: {
  id: string;
  title: string;
  reportType: string;
  period: string;
  approvalStatus: string;
  uploadedAt: Date;
  orgUnit: { id: string; name: string; level: string } | null;
  fileOrigName: string | null;
  fileSizeBytes: number | null;
  parsedJson: Prisma.JsonValue | null;
}): ReportListRow {
  const parseStatus = getReportParseStatus(row.parsedJson);
  return {
    id: row.id,
    title: row.title,
    reportType: row.reportType,
    period: row.period,
    approvalStatus: row.approvalStatus,
    uploadedAt: row.uploadedAt.toISOString(),
    orgUnit: row.orgUnit ?? null,
    fileOrigName: row.fileOrigName ?? null,
    fileSizeBytes: row.fileSizeBytes ?? null,
    hasParsed: parseStatus.hasParsed,
    parseEngine: parseStatus.engine,
    hasSignals: parseStatus.hasSignals,
    parseWarning: parseStatus.parseWarning,
    textExtracted: parseStatus.textExtracted,
    signalCount: parseStatus.signalCount,
  };
}

export async function listReports(input: {
  filters: ReportFilters;
  page?: string | number | null;
  pageSize?: string | number | null;
  scopeWhere?: ScopeWhere;
}): Promise<ReportListResult> {
  const where = buildReportWhere(input.filters, input.scopeWhere);
  const requested = normalizeReportPagination({ page: input.page, pageSize: input.pageSize });

  const [total, rows] = await Promise.all([
    prisma.report.count({ where }),
    prisma.report.findMany({
      where,
      include: { orgUnit: { select: { id: true, name: true, level: true } } },
      orderBy: { uploadedAt: "desc" },
      skip: reportPaginationOffset(requested),
      take: requested.pageSize,
    }),
  ]);

  return {
    rows: rows.map(mapListRow),
    pagination: normalizeReportPagination({ page: requested.page, pageSize: requested.pageSize, total }),
  };
}

export async function getReportDetail(input: {
  id: string;
  scopeWhere?: ScopeWhere;
}): Promise<ReportDetail | null> {
  const row = await prisma.report.findFirst({
    where: {
      id: input.id,
      ...(input.scopeWhere ?? {}),
    },
    include: { orgUnit: { select: { id: true, name: true, level: true } } },
  });

  if (!row) return null;

  return {
    ...mapListRow(row),
    rawContent: row.rawContent ?? null,
    parsedJson: row.parsedJson ?? null,
    filePath: row.filePath ?? null,
    fileMime: row.fileMime ?? null,
    monthlyPulse: row.rawContent ? parseMonthlyPulse(row.rawContent) : null,
  };
}
