/**
 * 市场洞察 demo 数据。
 * 真实部署时由 Hermes 抓取写入 DB；此处提供董事会演示用基线。
 * 故意保留盲区（null）以体现「缺少把控 = 风险」。
 */
import type { CompetitorTrack, IntelDimension, IntelSignal, IntelSource } from "./types";
import type { SwotItem } from "./swot";

export const demoSources: IntelSource[] = [
  { id: "src-smith-site", competitor: "史密斯", kind: "official_site", url: "https://www.aosmith.com.cn", cadenceDays: 7, lastScrapedAt: "2026-06-17", health: "active" },
  { id: "src-smith-filing", competitor: "史密斯", kind: "filing", url: "https://www.aosmith.com/investors", cadenceDays: 30, lastScrapedAt: "2026-06-01", health: "active" },
  { id: "src-rinnai-site", competitor: "林内", kind: "official_site", url: "https://www.rinnai.com.cn", cadenceDays: 7, lastScrapedAt: "2026-06-16", health: "active" },
  { id: "src-rinnai-social", competitor: "林内", kind: "social", url: null, cadenceDays: 14, lastScrapedAt: "2026-05-20", health: "stale" },
  { id: "src-carrier-press", competitor: "开利", kind: "press", url: "https://www.corporate.carrier.com/news", cadenceDays: 14, lastScrapedAt: "2026-06-15", health: "active" },
  { id: "src-carrier-patent", competitor: "开利", kind: "patent", url: null, cadenceDays: 30, lastScrapedAt: null, health: "empty" },
  { id: "src-haier-site", competitor: "海尔", kind: "official_site", url: "https://www.haier.com", cadenceDays: 7, lastScrapedAt: "2026-06-17", health: "active" },
  { id: "src-midea-channel", competitor: "美的", kind: "channel", url: null, cadenceDays: 14, lastScrapedAt: null, health: "empty" },
  { id: "src-smith-recruit", competitor: "史密斯", kind: "recruitment", url: "https://www.aosmith.com.cn/careers", cadenceDays: 14, lastScrapedAt: "2026-06-16", health: "active" },
  { id: "src-smith-patent", competitor: "史密斯", kind: "patent", url: null, cadenceDays: 30, lastScrapedAt: "2026-06-10", health: "active" },
  { id: "src-carrier-recruit", competitor: "开利", kind: "recruitment", url: null, cadenceDays: 14, lastScrapedAt: null, health: "empty" },
];

export const demoSignals: IntelSignal[] = [
  {
    id: "sig-1",
    competitor: "史密斯",
    dimension: "product",
    title: "推出 AI 净恒温热泵两联供新品",
    summary: "史密斯发布主打「AI 控温 + 净水联动」的热泵两联供，定位高端，瞄准南方采暖+热水一体场景，与我方 V4 热泵产品化窗口直接重叠。",
    impact: "threat",
    relevance: 92,
    sourceKind: "official_site",
    sourceLabel: "史密斯官网 newsroom 2026-06-15",
    capturedAt: "2026-06-17",
    linkedAssumptionCode: "H2",
    linkedActionCode: "V4",
  },
  {
    id: "sig-2",
    competitor: "史密斯",
    dimension: "gtm",
    title: "华东酒店渠道加速签约",
    summary: "Q2 华东酒店工程渠道新签约约 300 家，明显领先行业，配套专项返利政策。我方同期约 62 家。",
    impact: "threat",
    relevance: 88,
    sourceKind: "channel",
    sourceLabel: "渠道调研 2026-06-10",
    capturedAt: "2026-06-12",
    linkedAssumptionCode: "H5",
    linkedActionCode: "V1",
  },
  {
    id: "sig-3",
    competitor: "林内",
    dimension: "brand",
    title: "签约新代言人，主攻年轻家庭",
    summary: "林内启用新生代代言人并投放梯媒+短视频组合，品牌调性年轻化，抢占新装修家庭心智。",
    impact: "neutral",
    relevance: 54,
    sourceKind: "social",
    sourceLabel: "公众号/梯媒监测 2026-06-08",
    capturedAt: "2026-06-14",
  },
  {
    id: "sig-4",
    competitor: "开利",
    dimension: "strategy",
    title: "区域并购整合暖通服务商",
    summary: "开利收购一家华南暖通安装服务商，补强工程交付与售后网络，强化 B 端一体化能力。",
    impact: "threat",
    relevance: 76,
    sourceKind: "press",
    sourceLabel: "行业媒体 2026-06-13",
    capturedAt: "2026-06-15",
    linkedActionCode: "V1",
  },
  {
    id: "sig-5",
    competitor: "海尔",
    dimension: "product",
    title: "三联供集成方案铺市",
    summary: "海尔推「采暖+热水+净水」三联供集成方案，绑定智能家居生态，主打整装渠道。",
    impact: "opportunity",
    relevance: 61,
    sourceKind: "official_site",
    sourceLabel: "海尔官网 2026-06-16",
    capturedAt: "2026-06-17",
  },
  {
    id: "sig-6",
    competitor: "史密斯",
    dimension: "strategy",
    title: "财报披露：热泵营收同比高增",
    summary: "最新季报披露中国区热泵品类营收同比双位数增长，明确加大产能与研发投入指引。",
    impact: "threat",
    relevance: 70,
    sourceKind: "filing",
    sourceLabel: "AO Smith 季报 2026-Q1",
    capturedAt: "2026-06-01",
    linkedAssumptionCode: "H2",
  },
  {
    id: "sig-7",
    competitor: "史密斯",
    dimension: "product",
    title: "招聘热泵变频控制工程师 20+ 名",
    summary: "史密斯华东研发中心密集招聘热泵变频控制、压缩机匹配岗位 20 余名，jd 明确提到「新一代 R290 环保冷媒平台」，技术路线先于产品发布约 9 个月。",
    impact: "threat",
    relevance: 84,
    sourceKind: "recruitment",
    sourceLabel: "史密斯招聘官网 2026-06-16",
    capturedAt: "2026-06-16",
    linkedAssumptionCode: "H2",
    verdict: "supported",
    evidence: "新一代 R290 环保冷媒平台",
  },
  {
    id: "sig-8",
    competitor: "史密斯",
    dimension: "product",
    title: "专利公开：R290 微通道换热结构",
    summary: "史密斯公开一项 R290 微通道换热器专利，指向更高能效与更小充注量，是其下一代热泵平台的核心技术储备。",
    impact: "threat",
    relevance: 79,
    sourceKind: "patent",
    sourceLabel: "专利检索 2026-06-10",
    capturedAt: "2026-06-10",
    linkedAssumptionCode: "H2",
    verdict: "supported",
    evidence: "R290 微通道换热器",
  },
];

export const demoTracks: CompetitorTrack[] = [
  {
    competitor: "史密斯",
    product: "AI 净恒温热泵两联供（高端）",
    gtm: "华东酒店渠道激进签约 + 专项返利",
    brand: "维持专业高端，工程口碑投放",
    strategy: "热泵产能/研发加投，季报指引明确",
    momentum: "up",
    momentumNote: "四维度全面活跃，热泵+渠道双线施压，本期威胁等级最高",
  },
  {
    competitor: "林内",
    product: null,
    gtm: null,
    brand: "新代言人 + 梯媒短视频年轻化",
    strategy: null,
    momentum: "flat",
    momentumNote: "仅捕捉到品牌动作，产品/GTM/战略三维度为盲区，社媒来源已超期",
  },
  {
    competitor: "开利",
    product: null,
    gtm: null,
    brand: null,
    strategy: "并购华南暖通服务商，补强 B 端交付",
    momentum: "up",
    momentumNote: "战略层并购信号明确，但产品/专利来源缺失，技术动向盲区",
  },
  {
    competitor: "海尔",
    product: "三联供集成方案绑定智能家居",
    gtm: "整装渠道铺市",
    brand: null,
    strategy: null,
    momentum: "up",
    momentumNote: "生态化打法值得借鉴，可作为我方整装渠道机会参考",
  },
  {
    competitor: "美的",
    product: null,
    gtm: null,
    brand: null,
    strategy: null,
    momentum: "flat",
    momentumNote: "渠道情报来源从未抓到数据，全维度盲区 —— 对该对手缺乏任何把控",
  },
];

/**
 * 我方内部 S/W 基线（SWOT 推演用）。
 * 占位演示数据；正式部署应由 /compass 假设前提审计 + /health + /finance 取数。
 */
export const demoInternalSwot: SwotItem[] = [
  { id: "s-network", category: "strength", title: "全国服务网络与售后口碑", weight: 5, intensity: 4, source: "internal:compass" },
  { id: "s-brand", category: "strength", title: "Rheem/Ruud 双品牌高端定位", weight: 4, intensity: 4, source: "internal:compass" },
  { id: "s-tech", category: "strength", title: "商用热水技术积累", weight: 4, intensity: 3, source: "internal:compass" },
  { id: "w-hp", category: "weakness", title: "热泵两联供产品化窗口落后约 9 个月", weight: 5, intensity: 4, dimension: "product", source: "internal:compass" },
  { id: "w-channel", category: "weakness", title: "华东酒店工程渠道签约落后（62 vs 300）", weight: 5, intensity: 4, dimension: "gtm", source: "internal:compass" },
  { id: "w-ecosystem", category: "weakness", title: "整装/智能家居生态布局不足", weight: 3, intensity: 3, dimension: "strategy", source: "internal:compass" },
];

/**
 * 我方各维度自评分 0..100（十字坐标轴「我方」定位用）。
 * 占位基线；正式部署由 /compass 内部数据或战略会人工校准。
 */
export const demoSelfScores: Partial<Record<IntelDimension, number>> = {
  product: 50,
  strategy: 52,
  gtm: 45,
  brand: 58,
};
