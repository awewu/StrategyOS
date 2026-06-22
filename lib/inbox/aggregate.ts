import { dbAvailable, prisma } from "@/lib/db";
import { getCommandDeckBundle, getFpaSummary } from "@/lib/data/strategy-data";
import { getCompassBundle } from "@/lib/compass/data";
import { buildDecisionItems, buildTopAlerts } from "@/lib/panorama/scr";
import { topDiffs } from "@/lib/stratos";
import { demoSignals } from "@/lib/market-intel/demo-data";
import type { IntelSignal } from "@/lib/market-intel/types";
import { getActivePeriod } from "@/lib/data/active-period";

export type InboxItem = {
  id: string;
  sourceKey: string;
  severity: "critical" | "warning" | "info";
  title: string;
  summary: string;
  source: string;
  href: string;
  category: "decision" | "premise" | "market" | "stratdiff" | "alert" | "report";
};

async function loadThreatSignals(): Promise<IntelSignal[]> {
  try {
    if (!(await dbAvailable())) return demoSignals;
    const rows = await prisma.intelSignal.findMany({
      where: { impact: "threat", relevance: { gte: 60 } },
      orderBy: [{ relevance: "desc" }, { capturedAt: "desc" }],
      take: 8,
    });
    if (rows.length === 0) return demoSignals.filter((s) => s.impact === "threat");
    return rows.map((s) => ({
      id: s.id,
      competitor: s.competitor,
      dimension: s.dimension,
      title: s.title,
      summary: s.summary,
      impact: s.impact,
      relevance: s.relevance,
      sourceKind: "press",
      sourceLabel: s.sourceLabel,
      capturedAt: s.capturedAt.toISOString().slice(0, 10),
      linkedAssumptionCode: s.linkedAssumptionCode ?? undefined,
      verdict: s.verdict,
    }));
  } catch {
    return demoSignals.filter((s) => s.impact === "threat");
  }
}

/** 跨模块议题收件箱 — DEC / 罗盘前提 / 市场 / StratDiff / 告警 */
export async function computeInboxItems(): Promise<InboxItem[]> {
  const [deck, compass, threats] = await Promise.all([
    getCommandDeckBundle(),
    getCompassBundle(),
    loadThreatSignals(),
  ]);

  const items: InboxItem[] = [];

  for (const a of buildTopAlerts(deck, 5)) {
    items.push({
      id: `alert-${a.id}`,
      sourceKey: `alert-${a.id}`,
      severity: a.severity,
      title: a.message,
      summary: "指挥舱 HardBlock / 告警",
      source: "指挥舱",
      href: "/command",
      category: "alert",
    });
  }

  for (const d of buildDecisionItems(deck)) {
    items.push({
      id: d.id,
      sourceKey: d.id,
      severity: d.status === "open" ? "critical" : "warning",
      title: d.title,
      summary: [d.owner, d.deadline].filter(Boolean).join(" · "),
      source: "待决策 DEC",
      href: "/inbox#decisions",
      category: "decision",
    });
  }

  for (const p of compass.premises.filter((x) => x.failSignal)) {
    items.push({
      id: `premise-${p.id}`,
      sourceKey: `premise-${p.id}`,
      severity: p.fragility >= 80 ? "critical" : "warning",
      title: `${p.code} 前提失效`,
      summary: p.failSignal!,
      source: p.signalSource ?? "战略罗盘",
      href: "/compass",
      category: "premise",
    });
  }

  for (const d of topDiffs(deck.stratDiffs, 4)) {
    items.push({
      id: `diff-${d.title}`,
      sourceKey: `diff-${d.title}`,
      severity: d.severity === "critical" || d.severity === "high" ? "critical" : "warning",
      title: d.title,
      summary: d.detail ?? "版本对照差异 — 需纳入战略会或编制修订",
      source: "历史版本 · 对照",
      href: "/versions",
      category: "stratdiff",
    });
  }

  for (const s of threats.slice(0, 5)) {
    items.push({
      id: `intel-${s.id}`,
      sourceKey: `intel-${s.id}`,
      severity: s.relevance >= 75 ? "critical" : "warning",
      title: `[${s.competitor}] ${s.title}`,
      summary: s.summary.slice(0, 160),
      source: s.linkedAssumptionCode ? `Hermes · 挑战 ${s.linkedAssumptionCode}` : "Hermes · 市场洞察",
      href: s.linkedAssumptionCode ? `/compass` : "/market",
      category: "market",
    });
  }

  const order = { critical: 0, warning: 1, info: 2 };
  return items.sort((a, b) => order[a.severity] - order[b.severity]);
}

export async function getInboxItems() {
  const { mergeInboxWithRecords } = await import("./persist");
  return mergeInboxWithRecords(await computeInboxItems());
}

export type PipelineStatus = {
  fpaReady: boolean;
  runwayMonths: number | null;
  approvedReports: number;
  orgBoundReports: number;
  plansWithOrg: number;
};

/** 财务 runway + 月报 org 绑定就绪度 */
export async function getPipelineStatus(): Promise<PipelineStatus> {
  const fpa = await getFpaSummary();
  if (!(await dbAvailable())) {
    return {
      fpaReady: true,
      runwayMonths: fpa.cashRunwayMonths,
      approvedReports: 0,
      orgBoundReports: 0,
      plansWithOrg: 0,
    };
  }

  const [approvedReports, orgBoundReports, plansWithOrg] = await Promise.all([
    prisma.report.count({ where: { approvalStatus: "APPROVED" } }),
    prisma.report.count({ where: { approvalStatus: "APPROVED", orgUnitId: { not: null } } }),
    prisma.strategicPlan.count(),
  ]);

  const cash = await prisma.cashPosition.findFirst({
    where: { period: await getActivePeriod() },
    orderBy: { asOfDate: "desc" },
  });

  return {
    fpaReady: Boolean(cash),
    runwayMonths: cash ? Number(cash.runwayMonths) : fpa.cashRunwayMonths,
    approvedReports,
    orgBoundReports,
    plansWithOrg,
  };
}
