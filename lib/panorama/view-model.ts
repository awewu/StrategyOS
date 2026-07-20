import type { getCommandDeckBundle } from "@/lib/data/strategy-data";
import { brand } from "@/lib/brand/tokens";
import {
  buildScrSummary,
  buildTopAlerts,
  buildImplications,
  buildDecisionItems,
  buildIssueTree,
} from "@/lib/panorama/scr";
import type { ScrSummary, AlertItem, DecisionItem, IssueTreeNode } from "@/lib/panorama/scr";

type FullPanoramaDeck = Awaited<ReturnType<typeof getCommandDeckBundle>>;
// bscComparison 仅供指挥舱 UI 使用；panorama 视图模型不消费 → 可选，避免既有测试 mock 失效。
export type PanoramaDeck = Omit<FullPanoramaDeck, "bscComparison" | "bsc"> & Partial<Pick<FullPanoramaDeck, "bscComparison" | "bsc">>;

export interface PanoramaViewModel {
  brandName: string;
  taglineZh: string;
  taglineEn: string;
  period: string;
  sourceLabel: string;
  challenge: string;
  crux: string;
  robust: number;
  runwayMonths: number;
  revenueForecast: number;
  capexBudget: number;
  rosActual: number;
  ebitdaMarginActual: number;
  activeAssertion: string | null;
  statusLabel: string;
  scr: ScrSummary;
  topAlerts: AlertItem[];
  implications: string[];
  decisions: DecisionItem[];
  issueTree: IssueTreeNode[];
  oneMinuteDiagram: string;
  bscLightsLine: string;
  fpaLines: string[];
  capStackLines: string[];
  topDiffs: Array<{ severity: string; title: string }>;
}

export const ONE_MINUTE_DIAGRAM = `【认知与诊断】
 Rumelt 核心挑战 → WTP/HTW × 四品牌
         ↓
【三栈资源配置 · 同屏沙盘】
 CapStack ← 投资案        → 产能 / CAPEX / 现金波峰
 ProdStack ← 产品战略项  → 牌效 / JTBD / Roadmap
 GtmStack  ← 市场战略项  → 品牌×渠道 / 覆盖率
         ↓ 每项可挂 budget_tag → FPA Toggle
【解码与执行】
 BSC → OKR → Vx & Hx ↔ FPA (B-A-F · 四品牌 P&L)
         ↓
【史学留痕】
 月报/季报 → H1/FY 快照 → StratDiff (30类) → 下版 deliberate`;

const LIGHT_ZH: Record<string, string> = { green: "绿", yellow: "黄", red: "红" };

export function buildPanoramaViewModel(deck: PanoramaDeck): PanoramaViewModel {
  const lights = deck.bscLights;
  const mgmt = deck.managementReport.kpis;

  return {
    brandName: brand.name,
    taglineZh: brand.taglineZh,
    taglineEn: brand.taglineEn,
    period: deck.diagnosis.period,
    sourceLabel: deck.source === "database" ? "数据库" : "演示",
    challenge: deck.diagnosis.challengeStatement,
    crux: deck.diagnosis.crux,
    robust: deck.robustOverall,
    runwayMonths: deck.fpa.cashRunwayMonths,
    revenueForecast: deck.fpa.revenueForecast,
    capexBudget: deck.capStack.capexBudget,
    rosActual: mgmt.rosActual,
    ebitdaMarginActual: mgmt.ebitdaMarginActual,
    activeAssertion: deck.assertions.find((a) => a.active)?.message ?? null,
    statusLabel: "WORKING",
    scr: buildScrSummary(deck),
    topAlerts: buildTopAlerts(deck),
    implications: buildImplications(deck),
    decisions: buildDecisionItems(deck),
    issueTree: buildIssueTree(deck),
    oneMinuteDiagram: ONE_MINUTE_DIAGRAM,
    bscLightsLine: `财务 ${LIGHT_ZH[lights.financial]} · 客户 ${LIGHT_ZH[lights.customer]} · 流程 ${LIGHT_ZH[lights.process]} · 学习 ${LIGHT_ZH[lights.learning]}`,
    fpaLines: [
      `ROS 销售净利率 Actual：${(mgmt.rosActual * 100).toFixed(1)}% · EBITDA 利润率 ${(mgmt.ebitdaMarginActual * 100).toFixed(1)}%`,
      `EBITDA Actual：${Math.round(mgmt.ebitdaActual)} 万 · 毛利率 ${(mgmt.grossMarginActual * 100).toFixed(1)}%`,
      `营收 预/实/测：${deck.fpa.revenueBudget} / ${deck.fpa.revenueActual} / ${deck.fpa.revenueForecast}`,
      `现金 runway：${deck.fpa.cashRunwayMonths} 月`,
    ],
    capStackLines: [
      `CAPEX 预/实/测：${deck.capStack.capexBudget} / ${deck.capStack.capexActual} / ${deck.capStack.capexForecast} · 波峰 ${deck.capStack.cashPeakMonth}`,
      `三层面 H1 ${deck.capStack.byHorizon.H1}% · H2 ${deck.capStack.byHorizon.H2}% · H3 ${deck.capStack.byHorizon.H3}%`,
    ],
    topDiffs: deck.stratDiffs.slice(0, 5).map((d) => ({
      severity: d.severity,
      title: d.title,
    })),
  };
}

export const PANORAMA_KPI_CARDS = [
  { key: "robust", label: "稳健性" },
  { key: "runway", label: "Runway" },
  { key: "ros", label: "ROS" },
  { key: "ebitda", label: "EBITDA%" },
  { key: "revenue", label: "营收 F" },
  { key: "capex", label: "CAPEX B" },
  { key: "bsc", label: "BSC 四灯" },
  { key: "assertion", label: "Assertion" },
] as const;

export function kpiValue(vm: PanoramaViewModel, key: (typeof PANORAMA_KPI_CARDS)[number]["key"]) {
  switch (key) {
    case "robust":
      return String(vm.robust);
    case "runway":
      return `${vm.runwayMonths} 月`;
    case "ros":
      return `${(vm.rosActual * 100).toFixed(1)}%`;
    case "ebitda":
      return `${(vm.ebitdaMarginActual * 100).toFixed(1)}%`;
    case "revenue":
      return `${vm.revenueForecast} 万`;
    case "capex":
      return `${vm.capexBudget} 万`;
    case "bsc":
      return vm.bscLightsLine.replace(/ · /g, " ");
    case "assertion":
      return vm.activeAssertion ? "● 阻断" : "—";
  }
}
