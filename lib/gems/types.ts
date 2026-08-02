/**
 * Gems — 角色专属「审计洞察」AI 助理的共享类型。
 *
 * 一个 Gem = 以某角色视角、复用现有战略传感器做审计(查问题) + 洞察(给判断/下一步)。
 * 铁律(防幻觉): 每张洞察卡必须携带 evidence[] 引用其数据来源; 无证据的结论一律丢弃并计入 drops。
 */
export type InsightKind = "risk" | "change" | "advice" | "todo";
export type InsightSeverity = "critical" | "high" | "medium" | "low" | "info";
export type InsightSource = "audit" | "central-ai" | "local-fallback";

/** 接地证据: 结论所依赖的真实数据点(可下钻到源记录)。 */
export interface InsightEvidence {
  label: string;
  value: string;
  href?: string;
}

export interface InsightCard {
  id: string;
  kind: InsightKind;
  severity: InsightSeverity;
  title: string;
  detail: string;
  evidence: InsightEvidence[];
  action?: { href: string; label: string };
  source: InsightSource;
}

/** 构建某角色 Gem 所需的运行时上下文(会话 + 组织作用域), 保证不越权喂料。 */
export interface GemBuildContext {
  role: string;
  session: {
    name?: string | null;
    email?: string | null;
    orgUnitId?: string | null;
    orgScopeIds?: string[] | null;
    projectCode?: string | null;
  } | null;
  orgScope: string[] | null;
  projectScope: string[] | null;
}

export interface GemInsightResult {
  gem: string;
  persona: string;
  /** 角色定位副标题, e.g. "财务审计官" */
  tagline: string;
  period: string;
  generatedAt: string;
  /** 一句话态势 */
  headline: string;
  /** 若已有中央 AI/人工合理性研判, 其整体立场 */
  stance?: string;
  cards: InsightCard[];
  counts: Record<InsightKind, number>;
  /** 因缺少可引用证据被丢弃的条目数(防幻觉透明度) */
  drops: number;
  dataSource: string;
}
