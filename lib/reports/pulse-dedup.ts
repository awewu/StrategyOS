/**
 * Monthly Pulse duplicate detection — same org/period and near-duplicate history.
 */
import { dbAvailable, prisma } from "@/lib/db";
import { formatMonthlyPulse, type MonthlyPulseFields } from "@/lib/stratos/report-agent";
import { deduceOpsPulseDuplicates } from "@/lib/compiler/import-deduction";
import { isNearDuplicate, normalizeForMatch } from "@/lib/compiler/import-quality";

export type PulseDedupResult = {
  isDuplicate: boolean;
  level: "exact" | "near" | "none";
  message: string;
  matchedReportId?: string;
  matchedTitle?: string;
  matchedPeriod?: string;
};

function normalizePulse(fields: MonthlyPulseFields): string {
  return normalizeForMatch(
    [fields.oneLiner, fields.offTrackKr, fields.needHelp].filter(Boolean).join(" "),
  );
}

export async function checkPulseDuplicate(
  orgUnitId: string,
  period: string,
  fields: MonthlyPulseFields,
): Promise<PulseDedupResult> {
  const formatted = formatMonthlyPulse(fields);
  const norm = normalizePulse(fields);

  if (!(await dbAvailable())) {
    return { isDuplicate: false, level: "none", message: "无数据库 — 跳过查重" };
  }

  const samePeriod = await prisma.report.findMany({
    where: { orgUnitId, period, reportType: "MON_PULSE" },
    select: { id: true, title: true, period: true, rawContent: true },
    orderBy: { uploadedAt: "desc" },
    take: 20,
  });

  for (const r of samePeriod) {
    const existing = r.rawContent?.trim() ?? "";
    if (existing === formatted.trim()) {
      return {
        isDuplicate: true,
        level: "exact",
        message: `与本期已有脉搏完全重复（${r.id}）`,
        matchedReportId: r.id,
        matchedTitle: r.title,
        matchedPeriod: r.period,
      };
    }
    const parsed = existing.match(/§Pulse 本月一句话[：:]\s*(.+)/)?.[1]?.trim();
    if (parsed && isNearDuplicate(parsed, fields.oneLiner)) {
      return {
        isDuplicate: true,
        level: "near",
        message: `与本期脉搏高度相似：「${parsed.slice(0, 40)}…」`,
        matchedReportId: r.id,
        matchedTitle: r.title,
        matchedPeriod: r.period,
      };
    }
    if (norm.length >= 8 && existing && isNearDuplicate(norm, normalizeForMatch(existing))) {
      return {
        isDuplicate: true,
        level: "near",
        message: `与 ${r.period} 报告内容高度相似`,
        matchedReportId: r.id,
        matchedPeriod: r.period,
      };
    }
  }

  // 近 3 期 oneLiner 重复（跨月 copy-paste）
  const recent = await prisma.report.findMany({
    where: { orgUnitId, reportType: "MON_PULSE" },
    select: { id: true, period: true, rawContent: true },
    orderBy: { uploadedAt: "desc" },
    take: 12,
  });

  for (const r of recent) {
    if (r.period === period) continue;
    const parsed = r.rawContent?.match(/§Pulse 本月一句话[：:]\s*(.+)/)?.[1]?.trim();
    if (parsed && normalizeForMatch(parsed) === normalizeForMatch(fields.oneLiner)) {
      return {
        isDuplicate: true,
        level: "near",
        message: `本月一句话与 ${r.period} 完全相同，疑似复制粘贴`,
        matchedReportId: r.id,
        matchedPeriod: r.period,
      };
    }
  }

  return { isDuplicate: false, level: "none", message: "未发现重复脉搏" };
}

/** Batch check for Ops flood simulation */
export function checkPulseBatchDuplicates(pulses: MonthlyPulseFields[]): ReturnType<typeof deduceOpsPulseDuplicates> & {
  items: Array<{ index: number; oneLiner: string; duplicateOfIndex?: number }>;
} {
  const formatted = pulses.map((p) => formatMonthlyPulse(p));
  const base = deduceOpsPulseDuplicates(formatted);
  const items = pulses.map((p, index) => ({
    index,
    oneLiner: p.oneLiner.slice(0, 60),
    duplicateOfIndex: base.duplicateIndexes.includes(index)
      ? formatted.findIndex((f, i) => i < index && f.replace(/\s+/g, " ").trim().toLowerCase() === formatted[index]!.replace(/\s+/g, " ").trim().toLowerCase())
      : undefined,
  }));
  return { ...base, items };
}
