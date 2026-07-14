export interface RehearsalStep {
  id: string;
  segment: string;
  durationMin: number;
  title: string;
  objectives: string[];
  routes: Array<{ href: string; label: string }>;
  talkingPoints: string[];
  checklist: string[];
}

export const Q3_REHEARSAL_AGENDA: RehearsalStep[] = [
  {
    id: "open",
    segment: "开场",
    durationMin: 15,
    title: "诊断 · Robust · Top5 Diff",
    objectives: ["对齐 crux", "确认稳健性底线", "只看 Top 变化"],
    routes: [
      { href: "/command", label: "指挥舱" },
      { href: "/print/panorama", label: "董事会一页纸" },
    ],
    talkingPoints: [
      "核心挑战：从 1 亿到 2.5 亿，渠道与产品化不同步",
      "Robust 综合分含 R6 学习 — 涌现吸收率偏低需讨论",
      "HardBlockBar：runway 2.1 月 — 是否 CEO 例外或调整 CAPEX",
    ],
    checklist: ["四 BSC 灯已读", "Top3 StratDiff 已扫", "一票否决状态确认"],
  },
  {
    id: "capital",
    segment: "资本",
    durationMin: 30,
    title: "CapStack · IC Gate · 现金波峰 · 产能",
    objectives: ["三层面 CAPEX 比例", "IC 管道 Gate", "产能缺口反推"],
    routes: [
      { href: "/finance?tab=management", label: "管理报表" },
      { href: "/ma", label: "并购 · 资本交易" },
      { href: "/gates", label: "Gate 清单" },
    ],
    talkingPoints: [
      "H1 62% / H2 28% / H3 10% — 是否符合 deliberate 意图",
      "IC-2026-04 V4 产线 review — Real Option 放弃权",
      "9 月现金波峰 3200 万 · 缺口 1.7 万台 → IC-2026-04",
    ],
    checklist: ["Kanban Review/Approved 过一遍", "投后偏离 IC-2025-03 关注", "M&A 苏南 DD 进度"],
  },
  {
    id: "product",
    segment: "产品",
    durationMin: 30,
    title: "ProdStack · 产品战略项 · Gap · Innovate Gate",
    objectives: ["Roadmap now/next/later", "竞品 Gap", "V4 赌注"],
    routes: [
      { href: "/strategy", label: "看战略 · ProdStack" },
      { href: "/execution", label: "TechSignal / TRL" },
    ],
    talkingPoints: [
      "V4 Q3 样机 → Q4 平台冻结 — Cynefin complex 域",
      "史密斯热泵 tech lagging — V4 _closure",
      "RICE 排序：酒店签约 vs V4 加速",
    ],
    checklist: ["产品战略项 H2/H3 Gate", "JTBD 酒店不停业改造", "TRL 6→8 路径"],
  },
  {
    id: "growth",
    segment: "增长",
    durationMin: 30,
    title: "GtmStack · 市场战略项 · Deliver · LTV:CAC",
    objectives: ["段优先级", "AARRR 漏点", "Keller 品牌"],
    routes: [
      { href: "/strategy", label: "GtmStack + AARRR" },
      { href: "/finance?tab=scenarios", label: "SPBP 情景" },
    ],
    talkingPoints: [
      "酒店 820/1200 — 激活漏斗转化低于基准",
      "LTV:CAC 18:1 黄 — Deliver Gate 风险",
      "SPBP 悲观 25% — Q2 证据是否 nudge",
    ],
    checklist: ["市场战略项 2026 酒店签约", "Keller L1 显著性 gap", "覆盖率 actual 更新"],
  },
  {
    id: "decode",
    segment: "解码",
    durationMin: 45,
    title: "BSC/OKR · Hoshin · WTP/HTW",
    objectives: ["四维度 OKR 调整", "X-Matrix 对齐", "四品牌双卡"],
    routes: [
      { href: "/decode", label: "StratDecode" },
      { href: "/health", label: "看健康 · 十二维" },
    ],
    talkingPoints: [
      "财务 O 投资驱动增长 — runway 约束下 OKR 是否减量",
      "反馈环 R：签约口碑 — 勿过度乐观",
      "Hoshin 长期突破 ↔ V4 平台化 correlation",
    ],
    checklist: ["BSC 四卡红灯/黄灯决议", "反馈环 B 降价调节 — FPA 联动", "staff 十二维下钻（可选）"],
  },
  {
    id: "resolve",
    segment: "决议",
    durationMin: 30,
    title: "快照批准 · Agent · 承诺",
    objectives: ["冻结 WORKING 版", "§8 涌现入库", "承诺录入"],
    routes: [
      { href: "/versions", label: "版本库 · 快照冻结" },
      { href: "/reports", label: "报告 · Agent 编排" },
    ],
    talkingPoints: [
      "2026-H1-STRATEGIC 冻结 — HealthAssertion 是否例外签批",
      "Mintzberg diff #15–18 写入 StrategyPattern",
      "11 Agent 全链路跑 Sheet1 确认 SPBP nudge",
    ],
    checklist: ["SnapshotFreeze 演示", "反事实 diff 预览", "下版 deliberate 候选 3 条"],
  },
];

export const REHEARSAL_TOTAL_MIN = Q3_REHEARSAL_AGENDA.reduce((a, s) => a + s.durationMin, 0);
