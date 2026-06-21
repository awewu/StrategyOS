export type HoshinEntry = {
  id: string;
  label: string;
  tti: string;
  okr: string;
  action: string;
  owner: string;
  correlated?: boolean;
};

export type HoshinQuadrant = {
  rowLabel: string;
  colLabel: string;
  entries: HoshinEntry[];
};

/** I7 X-Matrix 四象限 — 含 TTI / OKR / 行动 / Owner */
export const HOSHIN_QUADRANTS: HoshinQuadrant[] = [
  {
    rowLabel: "南 · 长期突破",
    colLabel: "东 · 指标",
    entries: [
      {
        id: "h1",
        label: "营收 CAGR",
        tti: "12–24 月",
        okr: "O-增长 · KR 营收 +20%",
        action: "SPBP 情景绑定 FPA 输入",
        owner: "CEO / CFO",
        correlated: true,
      },
      {
        id: "h2",
        label: "NPS ≥ 45",
        tti: "18 月",
        okr: "O-客户 · KR NPS 段级达标",
        action: "酒店段体验 V1 闭环",
        owner: "CMO",
        correlated: true,
      },
    ],
  },
  {
    rowLabel: "南 · 长期突破",
    colLabel: "北 · 改善项目",
    entries: [
      {
        id: "h3",
        label: "V4 平台化",
        tti: "Q4 冻结",
        okr: "O-创新 · KR V4 平台冻结",
        action: "样机 EMC → 量产认证",
        owner: "研发 + 热水 BU",
        correlated: true,
      },
    ],
  },
  {
    rowLabel: "西 · 年度突破",
    colLabel: "东 · 指标",
    entries: [
      {
        id: "h4",
        label: "O1 增长",
        tti: "本 FY",
        okr: "KR 酒店 +380 家",
        action: "华东模式复制华南",
        owner: "王芳 · 华东",
        correlated: true,
      },
      {
        id: "h5",
        label: "O2 创新",
        tti: "Q3 样机",
        okr: "KR V4 样机通过率 100%",
        action: "控制算法冻结",
        owner: "李伟 · 热泵",
        correlated: true,
      },
    ],
  },
  {
    rowLabel: "西 · 年度突破",
    colLabel: "北 · 改善项目",
    entries: [
      {
        id: "h6",
        label: "V1 渠道",
        tti: "6 月",
        okr: "KR 激活漏斗 +15%",
        action: "AARRR 漏点修复",
        owner: "CMO",
        correlated: true,
      },
      {
        id: "h7",
        label: "V4 热泵",
        tti: "12 月",
        okr: "KR 首批 50 家渠道",
        action: "IC-04 产线决策",
        owner: "热水 BU",
        correlated: true,
      },
    ],
  },
];
