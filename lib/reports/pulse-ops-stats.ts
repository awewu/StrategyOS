/**
 * Ops dashboard stats — MON_PULSE dedup signals and recent report imports.
 */
import { dbAvailable, prisma } from "@/lib/db";
import { normalizeForMatch } from "@/lib/compiler/import-quality";

export type PulseDuplicateBlock = {
  orgUnitId: string;
  orgUnitName: string;
  period: string;
  count: number;
  reportIds: string[];
};

export type RecentImportRow = {
  id: string;
  reportType: string;
  period: string;
  title: string;
  orgUnitName: string | null;
  uploadedAt: string;
};

export type PulseOpsStats = {
  pulseTotal: number;
  pulseLast30Days: number;
  copyPasteSuspects: number;
  duplicateBlocks: PulseDuplicateBlock[];
  recentImports: RecentImportRow[];
  byType: Array<{ reportType: string; count: number }>;
};

const REPORT_TYPE_LABEL: Record<string, string> = {
  MON_PULSE: "月度脉搏",
  MON_RPT: "月报",
  QTR_REV: "季评",
  ANNUAL_RPT: "年报",
  SHEET_IMPORT: "表格导入",
  MEETING_MINUTES: "会议纪要",
};

export function reportTypeLabel(type: string): string {
  return REPORT_TYPE_LABEL[type] ?? type;
}

export async function getPulseOpsStats(): Promise<PulseOpsStats | null> {
  if (!(await dbAvailable())) return null;

  const since30 = new Date();
  since30.setDate(since30.getDate() - 30);

  const [pulseTotal, pulseLast30Days, pulses, recent, typeGroups] = await Promise.all([
    prisma.report.count({ where: { reportType: "MON_PULSE" } }),
    prisma.report.count({
      where: { reportType: "MON_PULSE", uploadedAt: { gte: since30 } },
    }),
    prisma.report.findMany({
      where: { reportType: "MON_PULSE", orgUnitId: { not: null } },
      select: {
        id: true,
        orgUnitId: true,
        period: true,
        rawContent: true,
        orgUnit: { select: { name: true } },
      },
      orderBy: { uploadedAt: "desc" },
      take: 500,
    }),
    prisma.report.findMany({
      select: {
        id: true,
        reportType: true,
        period: true,
        title: true,
        uploadedAt: true,
        orgUnit: { select: { name: true } },
      },
      orderBy: { uploadedAt: "desc" },
      take: 12,
    }),
    prisma.report.groupBy({
      by: ["reportType"],
      _count: { _all: true },
    }),
  ]);

  const byOrgPeriod = new Map<string, typeof pulses>();
  for (const p of pulses) {
    if (!p.orgUnitId) continue;
    const key = `${p.orgUnitId}::${p.period}`;
    const list = byOrgPeriod.get(key) ?? [];
    list.push(p);
    byOrgPeriod.set(key, list);
  }

  const duplicateBlocks: PulseDuplicateBlock[] = [];
  for (const [, group] of byOrgPeriod) {
    if (group.length < 2) continue;
    const first = group[0]!;
    duplicateBlocks.push({
      orgUnitId: first.orgUnitId!,
      orgUnitName: first.orgUnit?.name ?? first.orgUnitId!,
      period: first.period,
      count: group.length,
      reportIds: group.map((g) => g.id),
    });
  }

  duplicateBlocks.sort((a, b) => b.count - a.count);

  const oneLinerKeys = new Map<string, number>();
  for (const p of pulses) {
    const parsed = p.rawContent?.match(/§Pulse 本月一句话[：:]\s*(.+)/)?.[1]?.trim();
    if (!parsed) continue;
    const norm = normalizeForMatch(parsed);
    if (norm.length < 8) continue;
    oneLinerKeys.set(norm, (oneLinerKeys.get(norm) ?? 0) + 1);
  }
  const copyPasteSuspects = [...oneLinerKeys.values()].filter((n) => n > 1).length;

  return {
    pulseTotal,
    pulseLast30Days,
    copyPasteSuspects,
    duplicateBlocks: duplicateBlocks.slice(0, 8),
    recentImports: recent.map((r) => ({
      id: r.id,
      reportType: r.reportType,
      period: r.period,
      title: r.title,
      orgUnitName: r.orgUnit?.name ?? null,
      uploadedAt: r.uploadedAt.toISOString(),
    })),
    byType: typeGroups
      .map((g) => ({
        reportType: g.reportType,
        count: g._count._all,
      }))
      .sort((a, b) => b.count - a.count),
  };
}
