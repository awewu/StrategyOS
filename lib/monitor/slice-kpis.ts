import { dbAvailable, prisma } from "@/lib/db";
import type { KeyResult, TrafficLight } from "@/lib/types/stratos";
import { filterBySlice, type OrgSlice } from "@/lib/monitor/org-slices";

export type SliceKpi = {
  name: string;
  target: string;
  value: string;
  status: TrafficLight;
};

const HORIZON_START = 2026;
const HORIZON_END = 2028;

const DEMO_KPIS: Record<string, SliceKpi[]> = {
  "org-exec-hw": [
    { name: "营收完成率", target: "100%", value: "87%", status: "yellow" },
    { name: "V4 里程碑", target: "Q3 样机", value: "延迟 6 周", status: "red" },
    { name: "渠道签约", target: "1200 家", value: "820 家", status: "yellow" },
  ],
  "org-exec-rd": [
    { name: "TRL 达标项", target: "≥6", value: "4/6", status: "yellow" },
    { name: "专利提交", target: "12", value: "9", status: "green" },
    { name: "平台冻结", target: "Q4", value: "风险", status: "red" },
  ],
  "org-exec-finance": [
    { name: "Runway", target: "≥3 月", value: "2.1 月", status: "red" },
    { name: "ROS", target: "11.7%", value: "11.2%", status: "yellow" },
    { name: "IC 通过率", target: "100%", value: "71%", status: "yellow" },
  ],
  "org-exec-brand": [
    { name: "品牌 NPS", target: "≥45", value: "41", status: "yellow" },
    { name: "RUUD 工程占比", target: "35%", value: "32%", status: "yellow" },
    { name: "VI 一致性", target: "100%", value: "92%", status: "green" },
  ],
  "org-exec-bd": [
    { name: "战略客户签约", target: "24 家", value: "17 家", status: "yellow" },
    { name: "渠道拓展", target: "+15%", value: "+9%", status: "yellow" },
    { name: "投标胜率", target: "40%", value: "36%", status: "green" },
  ],
};

const REPORT_TYPE_LABELS: Record<string, string> = {
  MON_PULSE: "月度脉搏",
  MON_RPT: "月报",
  QTR_REV: "季度复盘",
  SHEET_IMPORT: "表格导入",
  ANNUAL_RPT: "年报",
  MEETING_MINUTES: "会议纪要",
};

function reportTypeLabel(type: string): string {
  return REPORT_TYPE_LABELS[type] ?? type;
}

function defaultDemoKpis(): SliceKpi[] {
  return [
    { name: "OKR 完成率", target: "85%", value: "78%", status: "yellow" },
    { name: "承诺兑现", target: "90%", value: "82%", status: "yellow" },
    { name: "预算执行", target: "100%", value: "94%", status: "green" },
  ];
}

function confidenceToStatus(confidence?: number): TrafficLight {
  if (confidence == null) return "yellow";
  if (confidence >= 0.8) return "green";
  if (confidence >= 0.6) return "yellow";
  return "red";
}

function leadingKrsToSliceKpis(slice: OrgSlice, leadingKrs: KeyResult[]): SliceKpi[] {
  return filterBySlice(leadingKrs, slice, [(kr) => kr.title, (kr) => kr.budgetTag]).map(
    (kr) => ({
      name: kr.title,
      target: kr.targetValue ?? "—",
      value: kr.currentValue ?? "—",
      status: confidenceToStatus(kr.confidence),
    }),
  );
}

async function planKpisForSlice(slice: OrgSlice): Promise<SliceKpi[]> {
  const plan = await prisma.strategicPlan.findUnique({
    where: {
      orgUnitId_horizonStart_horizonEnd: {
        orgUnitId: slice.id,
        horizonStart: HORIZON_START,
        horizonEnd: HORIZON_END,
      },
    },
    include: {
      objectives: {
        include: { keyResults: { orderBy: { sortOrder: "asc" } } },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
  if (!plan) return [];

  const kpis: SliceKpi[] = [];
  for (const obj of plan.objectives) {
    for (const kr of obj.keyResults) {
      kpis.push({
        name: kr.keyResult,
        target: kr.target ?? "—",
        value: "—",
        status: "yellow",
      });
    }
  }
  return kpis;
}

async function reportKpisForSlice(slice: OrgSlice): Promise<SliceKpi[]> {
  const reports = await prisma.report.findMany({
    where: { orgUnitId: slice.id, approvalStatus: "APPROVED" },
    orderBy: { uploadedAt: "desc" },
    take: 3,
  });
  return reports.map((r) => ({
    name: `${reportTypeLabel(r.reportType)} · ${r.period}`,
    target: "已存档",
    value: r.title.length > 36 ? `${r.title.slice(0, 36)}…` : r.title,
    status: "green" as TrafficLight,
  }));
}

function mergeKpis(primary: SliceKpi[], secondary: SliceKpi[], limit = 3): SliceKpi[] {
  const merged = [...primary];
  for (const item of secondary) {
    if (merged.length >= limit) break;
    if (!merged.some((m) => m.name === item.name)) merged.push(item);
  }
  return merged.slice(0, limit);
}

/** Resolve KPI rows for an N-1 org slice — plans / reports / leading KRs, else demo. */
export async function getSliceKpis(
  slice: OrgSlice,
  leadingKrs: KeyResult[] = [],
): Promise<{ kpis: SliceKpi[]; source: "database" | "demo" }> {
  const fromLeading = leadingKrsToSliceKpis(slice, leadingKrs);

  if (!(await dbAvailable())) {
    const demo = DEMO_KPIS[slice.id] ?? defaultDemoKpis();
    if (fromLeading.length > 0) {
      return { kpis: mergeKpis(fromLeading, demo), source: "demo" };
    }
    return { kpis: demo, source: "demo" };
  }

  const [fromPlan, fromReports] = await Promise.all([
    planKpisForSlice(slice),
    reportKpisForSlice(slice),
  ]);

  const merged = mergeKpis(fromLeading, mergeKpis(fromPlan, fromReports));
  if (merged.length > 0) {
    return { kpis: merged, source: "database" };
  }

  return { kpis: DEMO_KPIS[slice.id] ?? defaultDemoKpis(), source: "demo" };
}
