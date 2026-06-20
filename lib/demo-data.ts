import type { TrafficLight } from "./constants";

export const CURRENT_QUARTER = "2026-Q2";

export const healthOverview = {
  score: 72,
  quarter: CURRENT_QUARTER,
  dimensions: {
    financial: "yellow" as TrafficLight,
    customer: "green" as TrafficLight,
    process: "yellow" as TrafficLight,
    learning: "green" as TrafficLight,
  },
  kpis: [
    { name: "季度营收", value: "1,280 万", target: "1,500 万", status: "yellow" as TrafficLight },
    { name: "季度利润", value: "186 万", target: "220 万", status: "yellow" as TrafficLight },
    { name: "现金余额", value: "420 万", target: "≥300 万", status: "green" as TrafficLight },
    { name: "NPS", value: "—", target: "≥45", status: "green" as TrafficLight },
    { name: "客户满意度", value: "91%", target: "≥90%", status: "green" as TrafficLight },
    { name: "员工流失率", value: "8%", target: "≤10%", status: "green" as TrafficLight },
    { name: "单王人才", value: "3/5", target: "5/5", status: "yellow" as TrafficLight },
    { name: "项目准时率", value: "70%", target: "≥85%", status: "red" as TrafficLight },
  ],
};

export const alerts = [
  {
    id: "1",
    level: "high" as const,
    title: "V4 热泵项目里程碑延迟 3 周",
    owner: "张健",
    action: "需追加测试资源，VP 本周确认补救方案",
  },
  {
    id: "2",
    level: "medium" as const,
    title: "假设 H2「史密斯 Q3 不降价」验证中偏红",
    owner: "战略组",
    action: "市场专员补充竞品情报，下周五复盘",
  },
  {
    id: "3",
    level: "medium" as const,
    title: "Q2 营收缺口约 220 万",
    owner: "财务部",
    action: "恒热渠道冲刺方案待 CEO 确认",
  },
];

export const projects = [
  {
    code: "V1",
    name: "恒热渠道升级",
    owner: "毕韬",
    progress: 78,
    milestone: "核心经销商签约",
    status: "进行中",
    budgetSpent: 120,
    budgetTotal: 180,
    risk: "low" as const,
  },
  {
    code: "V4",
    name: "热泵新品上市",
    owner: "张健",
    progress: 52,
    milestone: "样机测试",
    status: "延迟",
    budgetSpent: 95,
    budgetTotal: 150,
    risk: "high" as const,
  },
  {
    code: "V7",
    name: "科技住宅样板房",
    owner: "李明",
    progress: 65,
    milestone: "方案定稿",
    status: "进行中",
    budgetSpent: 68,
    budgetTotal: 100,
    risk: "medium" as const,
  },
];

export const okrTree = {
  company: {
    objective: "2026：投资驱动增长，兑现核心承诺",
    keyResults: [
      "营收 6,000 万（+20%）",
      "热泵新品 V4 成功上市",
      "单王人才 5 人到位",
    ],
  },
  teams: [
    {
      name: "恒热事业部",
      owner: "毕韬",
      kr: "渠道签约 30 家核心经销商",
    },
    {
      name: "RUUD 事业部",
      owner: "张健",
      kr: "V4 样机测试通过，Q3 量产",
    },
  ],
};

export const commitments = [
  {
    user: "铁山",
    content: "Q3 战略会前完成四品牌 OGSM 一页纸对齐",
    promiseTo: "全员",
    deadline: "2026-09-05",
    status: "进行中",
  },
  {
    user: "毕韬",
    content: "8 月底前完成 20 家核心经销商签约",
    promiseTo: "CEO",
    deadline: "2026-08-31",
    status: "进行中",
  },
  {
    user: "张健",
    content: "V4 样机测试报告提交",
    promiseTo: "事业部",
    deadline: "2026-07-15",
    status: "逾期",
  },
];

export const mission = {
  vision: "成为区域领先的舒适家居与科技住宅解决方案提供者",
  mission: "以创新产品和可靠交付，让客户生活更舒适、更节能",
  yearGoal: "2026：稳健增长 · 产品创新 · 组织升级",
};
