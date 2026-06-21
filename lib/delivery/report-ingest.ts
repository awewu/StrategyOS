import { dbAvailable, prisma } from "@/lib/db";
import type { ParsedReport } from "@/lib/stratos/report-agent";

/** 月报审批后：从 parsedJson 写入 ExecutionTension */
export async function ingestReportExecutionSignals(reportId: string): Promise<number> {
  if (!(await dbAvailable())) return 0;

  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: { orgUnit: true },
  });
  if (!report?.parsedJson || report.approvalStatus !== "APPROVED") return 0;

  const parsed = report.parsedJson as unknown as ParsedReport;
  const period = report.period.length >= 7 ? report.period.slice(0, 7) : report.period;
  const projectName = report.orgUnit?.name ?? report.title.slice(0, 100);
  const projectCode = report.orgUnitId?.replace("org-exec-", "").toUpperCase().slice(0, 10) ?? "OPS";

  let created = 0;

  for (const decision of parsed.mckinsey?.decisions ?? []) {
    const signal = decision.trim().slice(0, 200);
    if (!signal) continue;
    await prisma.executionTension.create({
      data: {
        period,
        projectCode,
        projectName,
        tensionType: "direction",
        signal,
        diagnosis: `月报「${report.title}」待决事项`,
        recommendation: "进入议题 Inbox / 战略会审议",
        severity: "high",
      },
    });
    created++;
  }

  for (const trigger of parsed.assertionTriggers ?? []) {
    const signal = trigger.trim().slice(0, 200);
    if (!signal) continue;
    await prisma.executionTension.create({
      data: {
        period,
        projectCode,
        projectName,
        tensionType: "resource",
        signal,
        diagnosis: `月报硬阻断信号 · ${report.title}`,
        recommendation: "优先处理 FPA / Gate 准入",
        severity: "high",
      },
    });
    created++;
  }

  for (const pattern of parsed.patterns.filter((p) => p.suggestDeliberate)) {
    await prisma.executionTension.create({
      data: {
        period,
        projectCode,
        projectName,
        tensionType: "adaptation",
        signal: pattern.title.slice(0, 200),
        diagnosis: `涌现模式 · ${pattern.title.slice(0, 120)}`,
        recommendation: "写入 deliberate / 战略会",
        severity: "medium",
      },
    });
    created++;
  }

  return created;
}
