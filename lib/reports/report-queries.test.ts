import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildReportWhere,
  MAX_REPORT_PAGE_SIZE,
  normalizeReportPagination,
  reportPaginationOffset,
} from "./report-queries";
import { formatMonthlyPulse, parseMonthlyPulse } from "@/lib/stratos/report-agent";

describe("report-queries", () => {
  it("normalizes default pagination", () => {
    const pagination = normalizeReportPagination({});

    assert.equal(pagination.page, 1);
    assert.equal(pagination.pageSize, 10);
    assert.equal(pagination.total, 0);
    assert.equal(pagination.totalPages, 1);
    assert.equal(pagination.hasPrev, false);
    assert.equal(pagination.hasNext, false);
  });

  it("clamps page size and computes page flags", () => {
    const pagination = normalizeReportPagination({ page: "2", pageSize: "500", total: 101 });

    assert.equal(pagination.page, 2);
    assert.equal(pagination.pageSize, MAX_REPORT_PAGE_SIZE);
    assert.equal(pagination.totalPages, 3);
    assert.equal(pagination.hasPrev, true);
    assert.equal(pagination.hasNext, true);
  });

  it("falls back invalid page inputs", () => {
    const pagination = normalizeReportPagination({ page: "-1", pageSize: "0", total: 5 });

    assert.equal(pagination.page, 1);
    assert.equal(pagination.pageSize, 10);
    assert.equal(pagination.totalPages, 1);
  });

  it("computes Prisma offset from pagination", () => {
    assert.equal(reportPaginationOffset({ page: 1, pageSize: 10 }), 0);
    assert.equal(reportPaginationOffset({ page: 4, pageSize: 10 }), 30);
  });

  it("builds list filters with scope", () => {
    const where = buildReportWhere(
      { orgUnitId: "org-1", reportType: "MON_PULSE", period: "2026-06", approval: "PENDING" },
      { orgUnitId: { in: ["org-1", "org-2"] } },
    );

    assert.deepEqual(where, {
      orgUnitId: "org-1",
      reportType: "MON_PULSE",
      period: { startsWith: "2026-06" },
      approvalStatus: "PENDING",
    });
  });

  it("parses monthly pulse fields from normalized raw content", () => {
    const raw = formatMonthlyPulse({
      oneLiner: "Q2 revenue is on B track",
      offTrackKr: "Hotel signing 820/1200",
      needHelp: "Need CFO to confirm H2 CAPEX",
    });

    assert.deepEqual(parseMonthlyPulse(raw), {
      oneLiner: "Q2 revenue is on B track",
      offTrackKr: "Hotel signing 820/1200",
      needHelp: "Need CFO to confirm H2 CAPEX",
    });
  });

  it("returns null for non-pulse raw content", () => {
    assert.equal(parseMonthlyPulse("plain monthly report"), null);
  });
});
