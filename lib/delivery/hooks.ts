import { prisma } from "@/lib/db";
import { syncRunwayFromFpa } from "@/lib/fpa/runway-sync";
import { refreshCompassAudit } from "@/lib/compass/sync-audit";
import { ingestReportExecutionSignals } from "@/lib/delivery/report-ingest";

/** 月报存档后：解析张力 + runway 同步 + 罗盘审计刷新 */
export async function onReportApproved(reportId: string): Promise<void> {
  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report || report.approvalStatus !== "APPROVED") return;

  await ingestReportExecutionSignals(reportId).catch(() => undefined);

  const parsed = report.parsedJson as { assertionTriggers?: unknown[]; fpa?: { runwayMonths?: number } } | null;
  const runwayFromParse = parsed?.fpa?.runwayMonths;

  if (runwayFromParse != null) {
    await syncRunwayFromFpa({ runwayMonths: runwayFromParse });
  } else if (report.reportType === "SHEET_IMPORT" || report.reportType === "MON_RPT" || report.reportType === "MON_PULSE") {
    await syncRunwayFromFpa();
  }

  const ns = await prisma.companyNorthStar.findFirst({ where: { active: true } });
  if (ns) {
    await refreshCompassAudit(ns.id, { assumptions: false, signals: true });
  }
}

/** Inbox 指派 → 承诺账本 DEC 写回 */
export async function createCommitmentFromInbox(opts: {
  title: string;
  ownerName: string;
  deadline: string;
  linkedAssumptionCode?: string;
}): Promise<string> {
  const row = await prisma.commitment.create({
    data: {
      ownerName: opts.ownerName,
      promiseTo: opts.ownerName,
      content: opts.title,
      deadline: new Date(opts.deadline),
      status: "pending",
      linkedAssumptionCode: opts.linkedAssumptionCode ?? null,
    },
  });
  return row.id;
}
