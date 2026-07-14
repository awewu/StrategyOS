export const PRODUCT = {
  name: "StratOS",
  tagline: "战略是抉择",
  subtitle: "StratOS · 瑞合瑞德",
  claim: "年中/年底两次战略会 · 三栈资源配置同屏 · Decide with clarity.",
} as const;

/**
 * Fallback for the active strategic period.
 * The authoritative active period is DB-driven via `getActivePeriod()`
 * (SystemSetting → FpaPeriod heuristic). This constant is only the last-resort
 * fallback (demo mode / empty DB / client default) and can be overridden with
 * the STRATOS_DEFAULT_PERIOD env var.
 */
export const CURRENT_PERIOD = process.env.STRATOS_DEFAULT_PERIOD || "2026-FY";

export const DOCTRINES = [
  {
    en: "Invest to Growth",
    zh: "投资驱动增长",
    hint: "钱花在刀刃上，不浪费",
    scenario: "做预算时：这笔投入能带动增长吗？",
  },
  {
    en: "Innovate to Lead",
    zh: "创新引领",
    hint: "别抄别人，自己做出好东西",
    scenario: "做产品时：这个功能是抄的还是创新的？",
  },
  {
    en: "Deliver on Commitment",
    zh: "兑现承诺",
    hint: "说到做到，别放空炮",
    scenario: "定目标时：这个目标能做到吗？什么时候做到？",
  },
] as const;

export const BRANDS = ["瑞美", "恒热", "RUUD", "科技住宅"] as const;

export const PROJECT_CODES = [
  "V1",
  "V2",
  "V3",
  "V4",
  "V5",
  "V6",
  "V7",
  "V8",
  "V9",
  "V10",
] as const;

export const ROLES = {
  ceo: { label: "CEO", desc: "全部可见，批准战略、确认预警" },
  cfo: { label: "CFO", desc: "财务全景，预算/FP&A/资本配置" },
  vp: { label: "事业部负责人", desc: "本事业部全可见，设定 OKR" },
  system_head: { label: "体系负责人", desc: "本职能体系全可见，协调资源与能力" },
  pm: { label: "项目经理", desc: "本项目进度/预算/里程碑" },
  staff: { label: "职能专员", desc: "数据录入、报告生成" },
  observer: { label: "观察员", desc: "只读，战略地图与健康度" },
} as const;

export type RoleKey = keyof typeof ROLES;

export const MODULES = [
  {
    id: "align",
    code: "StratAlign",
    name: "战略共识",
    href: "/align",
    desc: "使命愿景 · BSC 地图 · OKR 对齐",
  },
  {
    id: "track",
    code: "StratTrack",
    name: "项目追踪",
    href: "/track",
    desc: "V1-V10 看板 · 假设 · 预警",
  },
  {
    id: "commit",
    code: "StratCommit",
    name: "承诺管理",
    href: "/commit",
    desc: "个人承诺 · 提醒 · 兑现率",
  },
  {
    id: "health",
    code: "StratHealth",
    name: "健康度",
    href: "/monitor/health",
    desc: "四维度红绿灯 · 综合评分",
  },
  {
    id: "review",
    code: "StratReview",
    name: "复盘与报告",
    href: "/review",
    desc: "GRAI+KPT · 快照 · AI 顾问",
  },
] as const;

export const BSC_DIMENSIONS = [
  { key: "financial", name: "财务", en: "Financial" },
  { key: "customer", name: "客户", en: "Customer" },
  { key: "process", name: "流程", en: "Process" },
  { key: "learning", name: "学习", en: "Learning" },
] as const;

export type TrafficLight = "green" | "yellow" | "red";

export const TRAFFIC_LABELS: Record<TrafficLight, string> = {
  green: "正常",
  yellow: "关注",
  red: "预警",
};
