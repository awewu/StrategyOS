import { dbAvailable, prisma } from "@/lib/db";

/** 报告→议题回执：提交人可见"我交的报告去了哪、CEO 裁没裁" */

export type ReceiptIssue = {
  sourceKey: string;
  title: string;
  status: "OPEN" | "DEFERRED" | "ASSIGNED" | "CLOSED";
  ownerName: string | null;
  resolution: string | null;
};

export type ReportReceipt = {
  reportId: string;
  title: string;
  period: string;
  uploadedAt: string;
  approvalStatus: string;
  parsed: boolean;
  triggerCount: number;
  issues: ReceiptIssue[];
};

const ISSUE_STATUS_LABEL: Record<ReceiptIssue["status"], string> = {
  OPEN: "待裁决",
  DEFERRED: "已延后",
  ASSIGNED: "已指派",
  CLOSED: "已议决",
};

export function issueStatusLabel(status: ReceiptIssue["status"]): string {
  return ISSUE_STATUS_LABEL[status];
}

/** 按 org scope 取最近报告，并追溯其触发的断言 → 议题处置状态 */
export async function getReportReceipts(orgUnitIds?: string[] | null, limit = 10): Promise<ReportReceipt[]> {
  if (!(await dbAvailable())) return [];

  const reports = await prisma.report.findMany({
    where:
      orgUnitIds && orgUnitIds.length > 0
        ? { orgUnitId: { in: orgUnitIds } }
        : undefined,
    orderBy: { uploadedAt: "desc" },
    take: limit,
    include: { healthAssertions: { select: { id: true, message: true } } },
  });
  if (reports.length === 0) return [];

  const assertionIds = reports.flatMap((r) => r.healthAssertions.map((a) => a.id));
  const inboxRecords =
    assertionIds.length > 0
      ? await prisma.inboxRecord.findMany({
          where: { sourceKey: { in: assertionIds.map((id) => `alert-${id}`) } },
        })
      : [];
  const recordByKey = new Map(inboxRecords.map((r) => [r.sourceKey, r]));

  return reports.map((r) => {
    const parsedObj = r.parsedJson as { assertionTriggers?: unknown[] } | null;
    const triggerCount = Array.isArray(parsedObj?.assertionTriggers)
      ? parsedObj.assertionTriggers.length
      : 0;
    const issues: ReceiptIssue[] = r.healthAssertions.map((a) => {
      const rec = recordByKey.get(`alert-${a.id}`);
      return {
        sourceKey: `alert-${a.id}`,
        title: a.message,
        status: (rec?.status ?? "OPEN") as ReceiptIssue["status"],
        ownerName: rec?.ownerName ?? null,
        resolution: rec?.resolution ?? null,
      };
    });
    return {
      reportId: r.id,
      title: r.title,
      period: r.period,
      uploadedAt: r.uploadedAt.toISOString().slice(0, 10),
      approvalStatus: r.approvalStatus,
      parsed: r.parsedJson != null,
      triggerCount,
      issues,
    };
  });
}
