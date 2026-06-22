import type {
  Assumption,
  BrandStrategyCard,
  CapStackPeriod,
  CapacitySnapshot,
  DiffRecord,
  FpaSummary,
  GtmBet,
  HealthAssertion,
  InvestmentCase,
  KeyResult,
  ProductBet,
  Project,
  SnapshotStatePayload,
  StrategicDiagnosis,
} from "./types/stratos";
import { computeStratDiff } from "./stratos/strat-diff";

export const CURRENT_PERIOD = "2026-FY";

export const diagnosis: StrategicDiagnosis = {
  id: "diag-fy26",
  period: CURRENT_PERIOD,
  challengeStatement: "从 1 亿到 2.5 亿，渠道扩张与产品化能力不同步",
  bottleneckType: "capability",
  crux: "热泵产品化 12 个月内能否成立",
  status: "approved",
};

export const brandCards: BrandStrategyCard[] = [
  {
    brandCode: "RUUD",
    winningAspiration: "华东热泵高端份额前三",
    whereToPlay: "酒店·家用·华东经销商",
    howToWin: "V4 平台化 + 不停业改造方案",
  },
  {
    brandCode: "HENGRE",
    winningAspiration: "核心经销商深度覆盖",
    whereToPlay: "区县组团·存量升级",
    howToWin: "渠道升级 + 服务响应 48h",
  },
  {
    brandCode: "RUIMEI",
    winningAspiration: "工程渠道稳健增长",
    whereToPlay: "商业工程·北方区域",
    howToWin: "总包绑定 + 验收通过率",
  },
  {
    brandCode: "TECH_HOME",
    winningAspiration: "科技住宅标杆项目",
    whereToPlay: "高端住宅·一线都市",
    howToWin: "系统方案 + 样板房体验",
  },
];

export const investmentCases: InvestmentCase[] = [
  {
    id: "ic-01",
    code: "IC-2026-01",
    title: "RUUD 华东渠道中心",
    type: "brand",
    horizon: "H1",
    capexTotal: 2800,
    expectedIrr: 18,
    gateStatus: "approved",
    budgetTag: "IC-2026-01",
    fpaToggle: "on",
  },
  {
    id: "ic-04",
    code: "IC-2026-04",
    title: "V4 热泵产线技改",
    type: "capacity",
    horizon: "H2",
    capexTotal: 4500,
    expectedIrr: 16,
    gateStatus: "review",
    budgetTag: "IC-2026-04",
    fpaToggle: "off",
  },
];

export const productBets: ProductBet[] = [
  {
    id: "pb-v4",
    title: "H2：V4 平台化",
    horizon: "H2",
    gateStatus: "approved",
    budgetTag: "PB-V4-2026",
    fpaToggle: "on",
  },
  {
    id: "pb-tech",
    title: "H3：科技住宅系统方案",
    horizon: "H3",
    gateStatus: "review",
    budgetTag: "PB-TECH-2026",
    fpaToggle: "off",
  },
];

export const gtmBets: GtmBet[] = [
  {
    id: "gb-hotel",
    title: "2026 酒店签约 1200 家",
    gateStatus: "approved",
    budgetTag: "GB-HOTEL-2026",
    fpaToggle: "on",
  },
];

export const projects: Project[] = [
  {
    id: "vx-v4",
    code: "V4",
    name: "热泵新品上市",
    cynefinDomain: "complex",
    horizon: "H2",
    progressPercent: 52,
    status: "active",
    budgetTotal: 150,
    budgetSpent: 95,
    riskLevel: "high",
    owner: "张健",
  },
  {
    id: "vx-v1",
    code: "V1",
    name: "恒热渠道升级",
    cynefinDomain: "complicated",
    horizon: "H1",
    progressPercent: 78,
    status: "active",
    budgetTotal: 180,
    budgetSpent: 120,
    riskLevel: "low",
    owner: "毕韬",
  },
  {
    id: "vx-v6",
    code: "V6",
    name: "区域 M&A 预研",
    cynefinDomain: "complex",
    horizon: "H3",
    progressPercent: 0,
    status: "active",
    budgetTotal: 50,
    budgetSpent: 0,
    riskLevel: "medium",
    owner: "战略组",
  },
];

export const assumptions: Assumption[] = [
  {
    id: "hx-h2",
    code: "H2",
    content: "史密斯 Q3 不降价",
    cynefinDomain: "complex",
    result: "pending",
  },
  {
    id: "hx-h5",
    code: "H5",
    content: "酒店签约全年 ≥1200 家",
    cynefinDomain: "complicated",
    result: "pending",
  },
];

export const objectives = [
  { id: "obj-wig", title: diagnosis.crux },
  { id: "obj-channel", title: "华东渠道新签规模化" },
];

export const leadingKrs: KeyResult[] = [
  {
    id: "kr-lead-1",
    title: "V4 样机测试通过率",
    budgetTag: "KR-V4-TEST",
    targetValue: "100%",
    currentValue: "72%",
    confidence: 0.65,
    isLeadingIndicator: true,
  },
  {
    id: "kr-lead-2",
    title: "Q2 华东新签 80 家",
    budgetTag: "KR-Q2-SIGN",
    targetValue: "80",
    currentValue: "62",
    confidence: 0.7,
    isLeadingIndicator: true,
  },
];

export const laggingKrs: KeyResult[] = [
  {
    id: "kr-lag-1",
    title: "FY26 热泵营收",
    budgetTag: "KR-REV",
    targetValue: "2.5亿",
    currentValue: "1.2亿",
    confidence: 0.55,
    isLeadingIndicator: false,
  },
];

export const fpa: FpaSummary = {
  revenueBudget: 6000,
  revenueActual: 5120,
  revenueForecast: 5800,
  profitBudget: 880,
  profitActual: 720,
  profitForecast: 820,
  cashRunwayMonths: 2.1,
};

export const capStack: CapStackPeriod = {
  period: CURRENT_PERIOD,
  capexBudget: 12000,
  capexActual: 9000,
  capexForecast: 11000,
  byHorizon: { H1: 62, H2: 28, H3: 10 },
  byBrand: { RUUD: 35, HENGRE: 30, RUIMEI: 25, TECH_HOME: 10 },
  byType: { strategic: 20, capacity: 40, technology: 25, brand: 10, people: 5 },
  cashPeakMonth: "2026-09",
  cashPeakAmount: 3200,
  runwayAfterPeak: 2.8,
};

export const capacity: CapacitySnapshot = {
  demandUnits: 82000,
  capacityUnits: 65000,
  gapUnits: 17000,
  utilizationPct: 79,
  gapAction: "invest",
  linkedIcCode: "IC-2026-04",
};

export const healthAssertion: HealthAssertion = {
  id: "ha-runway",
  assertionType: "runway",
  active: true,
  message: "一票否决：现金 runway 2.1 月",
  metricValue: 2.1,
  thresholdValue: 3,
  sourceReportId: "rpt-2026-05",
};

export const snapshotFY25: SnapshotStatePayload = {
  diagnosis: { ...diagnosis, challengeStatement: "稳健增长，渠道先行" },
  investmentCases: [{ ...investmentCases[0], gateStatus: "review" }],
  projects: projects.map((p) => ({ ...p, progressPercent: p.code === "V4" ? 30 : p.progressPercent })),
  fpa: { ...fpa, revenueForecast: 6200, cashRunwayMonths: 3.5 },
  strategyPattern: {
    deliberateRealizationRate: 78,
    emergentPatterns: [],
    unrealizedItems: [],
    serendipitousItems: [],
    learningPrompts: [],
  },
};

export const snapshotFY26: SnapshotStatePayload = {
  diagnosis,
  brandCards,
  investmentCases,
  productBets,
  gtmBets,
  projects,
  assumptions,
  keyResults: leadingKrs,
  fpa,
  capStack,
  capacity,
  healthAssertions: [healthAssertion],
  strategyPattern: {
    deliberateRealizationRate: 52,
    emergentPatterns: [{ title: "区县经销商自发组团签约", suggestDeliberate: true }],
    unrealizedItems: [{ objectType: "project", title: "V6 未启动" }],
    serendipitousItems: [{ title: "科技住宅意外获 3 标杆项目" }],
    learningPrompts: ["涌现模式是否写入下版 deliberate？"],
  },
};

export const stratDiffs: DiffRecord[] = computeStratDiff(snapshotFY25, snapshotFY26, [
  {
    formationType: "emergent",
    title: "区县经销商自发组团签约",
    linkedOkr: [],
    suggestDeliberate: true,
    reportId: "rpt-2026-05",
  },
  {
    formationType: "serendipitous",
    title: "科技住宅意外获 3 标杆项目",
    linkedOkr: [],
    reportId: "rpt-2026-05",
  },
]);

export const bscLights = {
  financial: "red" as const,
  customer: "green" as const,
  process: "yellow" as const,
  learning: "green" as const,
};

export const robustScore = {
  direction: 80,
  logic: 68,
  execution: 72,
  baseline: 70,
  doctrine: 85,
  learning: 58,
};

export const fiveYearForecast = [
  { year: "2026", revenueBudget: 6000, revenueForecast: 5800, profitBudget: 880, profitForecast: 820, capexBudget: 12000 },
  { year: "2027", revenueBudget: 8500, revenueForecast: 8200, profitBudget: 1200, profitForecast: 1100, capexBudget: 9000 },
  { year: "2028", revenueBudget: 12000, revenueForecast: 11500, profitBudget: 1680, profitForecast: 1580, capexBudget: 7500 },
  { year: "2029", revenueBudget: 16500, revenueForecast: 16000, profitBudget: 2310, profitForecast: 2200, capexBudget: 6000 },
  { year: "2030", revenueBudget: 22000, revenueForecast: 21000, profitBudget: 3080, profitForecast: 2900, capexBudget: 5000 },
];

export const sensitivityDrivers = [
  {
    id: "drv-hotel",
    label: "酒店签约达成率",
    baseValue: 68,
    unit: "%",
    lowDelta: -10,
    highDelta: 5,
    impactOnProfit: { low: -180, high: 90 },
  },
  {
    id: "drv-v4",
    label: "V4 上市延迟",
    baseValue: 0,
    unit: "月",
    lowDelta: 0,
    highDelta: 3,
    impactOnProfit: { low: 0, high: -220 },
  },
  {
    id: "drv-steel",
    label: "钢材成本",
    baseValue: 100,
    unit: "指数",
    lowDelta: -8,
    highDelta: 12,
    impactOnProfit: { low: 60, high: -95 },
  },
];

export const spbpScenarios = [
  {
    id: "sc-base",
    name: "基准",
    probability: 55,
    drivers: ["酒店 1200 家", "V4 Q4 上市", "渠道升级按计划"],
    fpaImpact: { revenue: 5800, profit: 820, runwayMonths: 2.1 },
    linkedAssumptionCodes: ["H5"],
  },
  {
    id: "sc-opt",
    name: "乐观",
    probability: 20,
    drivers: ["科技住宅超预期", "史密斯不降价", "产能缺口提前填平"],
    fpaImpact: { revenue: 6400, profit: 980, runwayMonths: 3.2 },
    linkedAssumptionCodes: ["H2"],
  },
  {
    id: "sc-pess",
    name: "悲观",
    probability: 25,
    drivers: ["V4 延迟 2Q", "现金波峰抬高", "竞品降价"],
    fpaImpact: { revenue: 5200, profit: 580, runwayMonths: 1.4 },
    linkedAssumptionCodes: ["H2", "H5"],
  },
];

export const maPipeline = [
  {
    id: "ma-01",
    name: "苏南区域经销商整合",
    direction: "channel" as const,
    stage: "dd" as const,
    synergyThesis: "华东酒店渠道密度 + 服务网络",
    valuationRange: "800–1200 万",
    linkedAssumptionCodes: ["H5"],
    integrationMilestone100d: "D30 品牌切换 · D60 库存并表 · D100 KPI 对齐",
  },
  {
    id: "ma-02",
    name: "热泵控制芯片 JV",
    direction: "jv" as const,
    stage: "screen" as const,
    synergyThesis: "V4 平台差异化 + 供应链安全",
    valuationRange: "待定",
    linkedAssumptionCodes: ["H2"],
  },
  {
    id: "ma-03",
    name: "北方商用渠道标的",
    direction: "channel" as const,
    stage: "watch" as const,
    synergyThesis: "RUIMEI 工程渠道补强",
    valuationRange: "500–900 万",
    linkedAssumptionCodes: [],
  },
];

export const realOptions = [
  {
    icCode: "IC-2026-04",
    title: "V4 热泵产线技改",
    stageGate: "样机验证通过 → 二期 CAPEX",
    abandonRight: true,
    nextCommitAmount: 2200,
    optionValueNote: "分阶段：首期 2300 万可终止，保留技术期权",
  },
  {
    icCode: "IC-2026-01",
    title: "RUUD 华东渠道中心",
    stageGate: "签约 600 家 → 扩建",
    abandonRight: false,
    nextCommitAmount: 800,
    optionValueNote: "已 commit；扩建权取决于 H1 覆盖",
  },
];

export const postInvestDeviations = [
  {
    icCode: "IC-2025-03",
    title: "恒热数字化门店",
    approvedCapex: 1200,
    actualCapex: 1380,
    expectedIrr: 15,
    actualIrr: 12,
    deviationPct: 15,
    status: "watch" as const,
  },
  {
    icCode: "IC-2025-07",
    title: "RUUD 样板房计划",
    approvedCapex: 600,
    actualCapex: 590,
    expectedIrr: 18,
    actualIrr: 19,
    deviationPct: -2,
    status: "on_track" as const,
  },
];

export const aarrrFunnel = [
  { stage: "acquisition" as const, label: "获客", count: 4200, conversionPct: 100, benchmarkPct: 100 },
  { stage: "activation" as const, label: "激活", count: 1680, conversionPct: 40, benchmarkPct: 45, leakNote: "样机体验转化偏低" },
  { stage: "retention" as const, label: "留存", count: 1176, conversionPct: 70, benchmarkPct: 72 },
  { stage: "revenue" as const, label: "收入", count: 820, conversionPct: 70, benchmarkPct: 68 },
  { stage: "referral" as const, label: "推荐", count: 164, conversionPct: 20, benchmarkPct: 25, leakNote: "经销商 NPS 转介绍弱" },
];

export const kellerBrandLayers = [
  { layer: 1, name: "显著性 Salience", score: 72, target: 80, note: "RUUD 华东认知待提升" },
  { layer: 2, name: "性能 Performance", score: 78, target: 85 },
  { layer: 3, name: "Imagery", score: 65, target: 75 },
  { layer: 4, name: "Judgments", score: 70, target: 78 },
  { layer: 5, name: "Feelings", score: 68, target: 75 },
  { layer: 6, name: "Resonance", score: 62, target: 70, note: "酒店业主社群弱" },
];

export const feedbackLoops = [
  {
    id: "fl-r1",
    kind: "R" as const,
    label: "签约口碑增强环",
    chain: "签约↑ → 案例↑ → 口碑↑ → 签约↑",
    bscDimension: "客户",
    fpaLinked: false,
  },
  {
    id: "fl-b1",
    kind: "B" as const,
    label: "降价份额调节环",
    chain: "降价↑ → 份额↑ → 利润↓ → 投入↓",
    bscDimension: "财务",
    fpaLinked: true,
  },
  {
    id: "fl-d1",
    kind: "D" as const,
    label: "培训中标延迟",
    chain: "渠道培训 → 6月后 → 中标率↑",
    bscDimension: "流程",
    fpaLinked: false,
  },
];

export const techSignals = [
  {
    id: "ts-v4",
    domain: "heat_pump" as const,
    title: "V4 变频控制算法",
    trl: 6,
    source: "研发月报 2026-05",
    horizon: "H2" as const,
    linkedProjectCode: "V4",
    urgency: "act" as const,
  },
  {
    id: "ts-chip",
    domain: "controls" as const,
    title: "自研主控芯片预研",
    trl: 3,
    source: "TechSignal 扫描",
    horizon: "H3" as const,
    linkedProjectCode: "V6",
    urgency: "watch" as const,
  },
  {
    id: "ts-eff",
    domain: "efficiency" as const,
    title: "酒店不停业改造工法",
    trl: 7,
    source: "标杆项目复盘",
    horizon: "H1" as const,
    linkedProjectCode: "V1",
    urgency: "invest" as const,
  },
];

export const riceItems = [
  {
    id: "rice-v4",
    initiative: "V4 Q3 上市加速",
    reach: 8,
    impact: 9,
    confidence: 0.65,
    effort: 7,
    score: 6.6,
    linkedVx: "V4",
  },
  {
    id: "rice-hotel",
    initiative: "酒店签约冲刺 Q2",
    reach: 9,
    impact: 7,
    confidence: 0.7,
    effort: 4,
    score: 11.0,
    linkedVx: "V1",
  },
  {
    id: "rice-ma",
    initiative: "苏南渠道整合 DD",
    reach: 6,
    impact: 8,
    confidence: 0.5,
    effort: 8,
    score: 2.4,
    linkedVx: "V6",
  },
];

export const trlRadar = [
  { domain: "热泵平台", current: 6, target: 8, gapNote: "V4 样机验证中" },
  { domain: "控制芯片", current: 3, target: 6, gapNote: "JV 预研" },
  { domain: "渠道数字化", current: 5, target: 7 },
  { domain: "服务响应", current: 7, target: 8 },
];

export function capitalSummaryLine(): string {
  return `FY CAPEX ${(capStack.capexBudget / 10000).toFixed(1)}亿 · H2 ${capStack.byHorizon.H2}% · ${capStack.cashPeakMonth.slice(5)}月波峰 · 缺口${(capacity.gapUnits / 10000).toFixed(1)}万台`;
}

export const bscCards = [
  { key: "financial", label: "财务", satisfaction: "股东满意", target: "营收 6000 万", light: "red" as const },
  { key: "customer", label: "客户", satisfaction: "客户满意", target: "NPS ≥45", light: "green" as const },
  { key: "process", label: "流程", satisfaction: "社会满意", target: "准时率 ≥85%", light: "yellow" as const },
  { key: "learning", label: "学习", satisfaction: "员工满意", target: "单王 5/5", light: "green" as const },
];

export const productRoadmap = [
  { lane: "now" as const, milestone: "RUUD 2026 迭代", quarter: "2026-Q2" },
  { lane: "now" as const, milestone: "V4 样机测试", quarter: "2026-Q3" },
  { lane: "next" as const, milestone: "V4 平台冻结", quarter: "2026-Q4" },
  { lane: "later" as const, milestone: "多品牌共用平台", quarter: "2027-H1" },
];

export const jtbdCards = [
  {
    product: "V4 热泵",
    statement: "酒店业主改造时，想在不停业前提下降低 30% 能耗并通过验收",
    segment: "酒店",
  },
];

export const productGaps = [
  { competitor: "史密斯", dimension: "热泵 tech", status: "lagging" as const, closure: "V4" },
];

export const gtmSegments = [
  { code: "SEG-HOTEL", name: "酒店", priority: "focus", coverage: "820/1200", ltvCac: "18:1 · 黄" },
  { code: "SEG-HOME", name: "家用", priority: "explore", coverage: "—", ltvCac: "—" },
];

export const snapshots = [
  { code: "2025-FY-STRATEGIC", period: "2025-FY", status: "FROZEN" as const, rate: 78 },
  { code: "2026-H1-STRATEGIC", period: "2026-H1", status: "FROZEN" as const, rate: 65 },
  { code: "2026-FY-STRATEGIC", period: "2026-FY", status: "WORKING" as const, rate: 52 },
];

export const reports = [
  {
    id: "rpt-2026-05",
    type: "MON_RPT" as const,
    period: "2026-05",
    title: "2026 年 5 月部门月报",
    status: "parsed" as const,
    patterns: ["涌现：区县经销商自发组团签约"],
  },
  {
    id: "rpt-2026-q1",
    type: "QTR_REV" as const,
    period: "2026-Q1",
    title: "2026 Q1 公司季报",
    status: "parsed" as const,
    patterns: [],
  },
  {
    id: "rpt-sheet1-may",
    type: "SHEET_IMPORT" as const,
    period: "2026-05",
    title: "Sheet1 财务 Excel",
    status: "pending" as const,
    patterns: [],
  },
];

export const horizonBubbles = [
  { code: "V1", name: "恒热渠道升级", horizon: "H1" as const, budget: 180, progress: 78, expectedReturn: 85 },
  { code: "V4", name: "热泵新品上市", horizon: "H2" as const, budget: 150, progress: 52, expectedReturn: 90 },
  { code: "V6", name: "区域 M&A 预研", horizon: "H3" as const, budget: 50, progress: 0, expectedReturn: 40 },
  { code: "V7", name: "科技住宅样板", horizon: "H2" as const, budget: 100, progress: 65, expectedReturn: 75 },
];

export const strategyPattern = snapshotFY26.strategyPattern!;
