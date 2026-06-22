/** 手册来源：《解决问题最简单的方式 — 价值为锚 V2》 */

export type DoctrineEntry = {
  en: string;
  zh: string;
  hint: string;
  scenario: string;
};

export type BehaviorGuidelineEntry = {
  id: number;
  title: string;
  items: string[];
};

export type CoreValuesIntroContent = {
  headline: string;
  body: string;
  principles: string[];
  decisionTest: string;
};

export type CultureHandbookContent = {
  doctrines: DoctrineEntry[];
  fourSatisfactionPillars: string[];
  coreValuesIntro: CoreValuesIntroContent;
  behaviorGuidelines: BehaviorGuidelineEntry[];
};

export const HANDBOOK_MISSION =
  "以创新高效低碳技术与数字化服务为核心，为每一个空间赋予更舒适、高效、可持续的生活环境。";

export const HANDBOOK_VISION = "成为受人尊重的水和空气产品及解决方案可持续发展的引领者。";

/** 四个满意 — 统一价值框架（非四选一） */
export const FOUR_SATISFACTION_PILLARS = ["股东满意", "员工满意", "客户满意", "社会满意"] as const;

export const CORE_VALUES_INTRO = {
  headline: "不是四选一，而是「全都要」",
  body:
    "股东、员工、客户、社会四个利益相关方是支撑企业发展的四大支柱，不分先后，缺一不可。我们拒绝零和博弈，追求系统最优解：把蛋糕做得更大、更优质，让四方都获得超出预期的满意。",
  principles: [
    "超越「小我」视角：不只盯着自己部门或个人的 KPI、OKR",
    "建立「全局」思维：把股东、员工、客户、社会看作息息相关的整体",
    "追求「共创」成果：寻找让整体利益最大、各方都长期受益的解决方案",
  ],
  decisionTest: "我的选择，是否会导致任何一个利益相关方受到损害？如果「是」，就代表这个决策是错误的。",
} as const;

/** 六项基本原则 — 行为准则 */
export const BEHAVIOR_GUIDELINES = [
  {
    id: 1,
    title: "以身作则",
    items: [
      "我要言行一致，践行价值观，维护公司声誉",
      "我秉持实事求是，对事不对人",
      "我在困难前率先行动，逆境中传递信心与韧性",
      "我以高标准要求自己，树立行为表率",
    ],
  },
  {
    id: 2,
    title: "以信任激发担当",
    items: [
      "我充分授权，对合理试错包容不指责",
      "我公开肯定他人贡献，尤其认可挑战中的主动担当",
      "我在同事遇到困难时主动支持补位，绝不做旁观者",
      "我事前充分表达观点，团队达成共识后无条件服从执行",
    ],
  },
  {
    id: 3,
    title: "倾听理解，以尊重促协作",
    items: [
      "我优先倾听他人以寻理解，不急于让自己被理解",
      "我尊重并重视不同的观点与贡献",
      "我主动分享信息，保持沟通顺畅以避免信息偏差造成误解",
      "我及时回应客户需求，在协作中换位思考实现共赢",
    ],
  },
  {
    id: 4,
    title: "交付尊重的贡献",
    items: [
      "我追求卓越，交付成果始终超出客户预期",
      "我关注长期价值，不做短期利益的妥协",
      "我注重细节，以专业性与可靠性赢得尊重",
      "我树立扎实的行业口碑，坚守可持续发展理念",
    ],
  },
  {
    id: 5,
    title: "创造性思考",
    items: [
      "我从不满足于现状，主动探索新的可能",
      "我复盘沉淀经验，激发创新思路",
      "我乐于尝试新方法新工具，提升工作成果",
      "我主动关注行业趋势，将外部洞察转化为内部创新机会",
    ],
  },
  {
    id: 6,
    title: "落实负责任的行动",
    items: [
      "我使命必达，严守时间节点交付工作",
      "我主动跟进工作，及时预警并反馈风险",
      "我勇于决策，敢于为结果承担责任",
      "我恪守道德合规，做事对得起职责",
      "我精打细算，把资源用在刀刃上，杜绝一切浪费",
    ],
  },
] as const;

/** 七大价值观奖项 — 评选标准目录 */
export const VALUES_AWARD_CATALOG = [
  {
    id: "perseverance",
    name: "百折不挠奖",
    criteria:
      "在工作中面对挑战坚持不懈、迎难而上，最终取得突出业绩、超越客户期望的个人或团队。",
  },
  {
    id: "customer",
    name: "客户满意奖",
    criteria:
      "在产品质量、客户服务、技能培训等相关工作中做出突出成绩，并超出客户期望值的个人或团队。",
  },
  {
    id: "disruptive",
    name: "颠覆创新奖",
    criteria:
      "在流程优化、运营模式升级、效率提升、工作方法改进中，以突破性思维实现显著创新，并成功在本年度内落地执行、创造实际价值的个人或团队。",
  },
  {
    id: "safety",
    name: "工作场所安全奖",
    criteria:
      "在创建安全工作场所方面做出贡献的个人及团队，如安装新防护装置、消除工作区潜在危险等；强调自觉自愿。",
  },
  {
    id: "environment",
    name: "环保贡献奖",
    criteria:
      "在预防环境污染或减少废弃物排放方面做出杰出贡献的员工；强调自觉自愿而非政府行为。",
  },
  {
    id: "community",
    name: "公益活动参与奖",
    criteria:
      "在造福社区、参与公益活动方面投入时间和精力的个人或团队（公司赞助的社会服务机构员工不在提名范围）。",
  },
  {
    id: "edwin-ruud",
    name: "EDWIN RUUD 年度创新先锋奖",
    criteria:
      "以开创性理念、核心技术或行业前沿方法，在产品研发领域实现大型突破、引领行业进步，且具有持续行业影响力的个人或团队。",
  },
] as const;

export type ValuesAwardWinner = {
  id: string;
  year: number;
  period: string;
  awardName: string;
  winner: string;
  unit: string;
  citation: string;
};

/** 近期获奖公示 — 待 HR/文化委员会录入 */
export const VALUES_AWARD_WINNERS: ValuesAwardWinner[] = [
  {
    id: "winner-placeholder",
    year: 2026,
    period: "待评选",
    awardName: "—",
    winner: "—",
    unit: "—",
    citation: "符合价值观的行为将在本栏公示。请 HR/文化委员会录入获奖人与事迹。",
  },
];

export type ValuesUnderstandingRecord = {
  id: string;
  date: string;
  title: string;
  unit: string;
  author: string;
  summary: string;
  relatedPrinciple?: string;
};

export const VALUES_UNDERSTANDING_INTRO =
  "行为反映价值观。本栏公示理解并践行价值观的典型案例与解读，便于全员对齐与传播。";

/** 理解价值观公示记录 — 待录入 */
export const VALUES_UNDERSTANDING_RECORDS: ValuesUnderstandingRecord[] = [
  {
    id: "pub-placeholder",
    date: "—",
    title: "暂无公示记录",
    unit: "—",
    author: "—",
    summary: "典型案例、解读文章与 CI 持续改进优秀提案将在此公示。",
  },
];

export const CI_CONTINUOUS_IMPROVEMENT = {
  title: "CI 持续改进",
  body:
    "鼓励每一位员工立足岗位发现问题、解决问题，在安全、质量、服务、设计、采购、生产、销售等环节进行持续改进，让「创造性思考」「落实负责任的行动」融入日常。",
  channels: [
    "现有工作流程、管理制度的优化方案",
    "产品设计、生产工艺、质量提升、成本优化、工作场所安全等改进建议",
    "提升客户服务体验、增强企业形象与口碑的创新举措",
  ],
} as const;
