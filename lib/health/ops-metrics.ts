/**
 * 全维度运营健康度指标定义 + 72个月时序 demo 数据
 * 36个月历史(2023-01 ~ 2025-12) + 36个月规划(2026-01 ~ 2028-12)
 */

export type MetricSignal = "green" | "yellow" | "red";

export interface MetricDef {
  id: string;
  name: string;
  unit: string;
  higherIsBetter: boolean;
  greenThreshold: number;
  yellowThreshold: number;
}

export interface DomainDef {
  id: string;
  name: string;
  color: string;
  metrics: MetricDef[];
}

export interface MonthPoint {
  month: string;
  actual: number | null;
  planned: number;
  yoy: number | null;
  mom: number | null;
}

export interface MetricSeries {
  metricId: string;
  domainId: string;
  points: MonthPoint[];
}

export const DOMAINS: DomainDef[] = [
  {
    id: "production", name: "生产", color: "#3b82f6",
    metrics: [
      { id: "prod_volume",    name: "月产量",       unit: "台",    higherIsBetter: true,  greenThreshold: 90,  yellowThreshold: 75  },
      { id: "prod_plan_rate", name: "计划达成率",   unit: "%",     higherIsBetter: true,  greenThreshold: 95,  yellowThreshold: 85  },
      { id: "prod_oee",       name: "设备综合效率", unit: "%",     higherIsBetter: true,  greenThreshold: 80,  yellowThreshold: 65  },
      { id: "prod_downtime",  name: "设备停机时长", unit: "h/月",  higherIsBetter: false, greenThreshold: 8,   yellowThreshold: 20  },
    ],
  },
  {
    id: "supply_chain", name: "供应链", color: "#8b5cf6",
    metrics: [
      { id: "sc_delivery",  name: "准时交货率",   unit: "%",  higherIsBetter: true,  greenThreshold: 95,  yellowThreshold: 85  },
      { id: "sc_inventory", name: "库存周转天数", unit: "天", higherIsBetter: false, greenThreshold: 30,  yellowThreshold: 45  },
      { id: "sc_shortage",  name: "缺料停线次数", unit: "次", higherIsBetter: false, greenThreshold: 0,   yellowThreshold: 2   },
      { id: "sc_cost",      name: "采购成本指数", unit: "pt", higherIsBetter: false, greenThreshold: 100, yellowThreshold: 108 },
    ],
  },
  {
    id: "manufacturing", name: "制造", color: "#f59e0b",
    metrics: [
      { id: "mfg_yield",  name: "一次通过率", unit: "%",    higherIsBetter: true,  greenThreshold: 98,  yellowThreshold: 95  },
      { id: "mfg_scrap",  name: "报废率",     unit: "%",    higherIsBetter: false, greenThreshold: 0.5, yellowThreshold: 1.5 },
      { id: "mfg_cycle",  name: "生产周期",   unit: "天",   higherIsBetter: false, greenThreshold: 5,   yellowThreshold: 8   },
      { id: "mfg_labor",  name: "人均产出",   unit: "台/人",higherIsBetter: true,  greenThreshold: 12,  yellowThreshold: 9   },
    ],
  },
  {
    id: "rd", name: "研发", color: "#10b981",
    metrics: [
      { id: "rd_milestone", name: "里程碑准时率",   unit: "%",   higherIsBetter: true,  greenThreshold: 90, yellowThreshold: 75 },
      { id: "rd_patent",    name: "专利申请数",     unit: "件/季",higherIsBetter: true, greenThreshold: 3,  yellowThreshold: 1  },
      { id: "rd_npi_cycle", name: "NPI开发周期",    unit: "月",  higherIsBetter: false, greenThreshold: 9,  yellowThreshold: 14 },
      { id: "rd_spend",     name: "研发投入占比",   unit: "%",   higherIsBetter: true,  greenThreshold: 5,  yellowThreshold: 3  },
    ],
  },
  {
    id: "quality", name: "质量", color: "#ef4444",
    metrics: [
      { id: "ql_ppm",       name: "出货PPM",     unit: "ppm", higherIsBetter: false, greenThreshold: 200, yellowThreshold: 500 },
      { id: "ql_complaint", name: "客户投诉件数", unit: "件",  higherIsBetter: false, greenThreshold: 3,   yellowThreshold: 8   },
      { id: "ql_recall",    name: "召回次数",     unit: "次",  higherIsBetter: false, greenThreshold: 0,   yellowThreshold: 1   },
      { id: "ql_audit",     name: "内审符合率",   unit: "%",   higherIsBetter: true,  greenThreshold: 95,  yellowThreshold: 85  },
    ],
  },
  {
    id: "product_mgmt", name: "产品管理", color: "#06b6d4",
    metrics: [
      { id: "pm_roadmap",     name: "Roadmap准时率", unit: "%", higherIsBetter: true, greenThreshold: 85, yellowThreshold: 70 },
      { id: "pm_new_revenue", name: "新品收入占比",  unit: "%", higherIsBetter: true, greenThreshold: 20, yellowThreshold: 10 },
      { id: "pm_lifecycle",   name: "SKU健康度",     unit: "pt",higherIsBetter: true, greenThreshold: 75, yellowThreshold: 55 },
      { id: "pm_gap",         name: "竞品差距改善率",unit: "%", higherIsBetter: true, greenThreshold: 60, yellowThreshold: 40 },
    ],
  },
  {
    id: "sales", name: "销售管理", color: "#f97316",
    metrics: [
      { id: "sl_revenue",  name: "月营收",       unit: "万元",higherIsBetter: true, greenThreshold: 90,  yellowThreshold: 75  },
      { id: "sl_win_rate", name: "签约成功率",   unit: "%",   higherIsBetter: true, greenThreshold: 35,  yellowThreshold: 22  },
      { id: "sl_coverage", name: "渠道覆盖达成率",unit: "%",  higherIsBetter: true, greenThreshold: 90,  yellowThreshold: 75  },
      { id: "sl_ltv_cac",  name: "LTV:CAC",      unit: "x",   higherIsBetter: true, greenThreshold: 4,   yellowThreshold: 2.5 },
    ],
  },
];

function allMonths(start: string, end: string): string[] {
  const r: string[] = [];
  let [y, m] = start.split("-").map(Number);
  const [ey, em] = end.split("-").map(Number);
  while (y < ey || (y === ey && m <= em)) {
    r.push(`${y}-${String(m).padStart(2, "0")}`);
    if (++m > 12) { m = 1; y++; }
  }
  return r;
}

export const HISTORY_END = "2025-12";
export const ALL_MONTHS  = allMonths("2023-01", "2028-12");
const HIST_LEN = allMonths("2023-01", HISTORY_END).length; // 36

function rng(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

const CFG: Record<string, { base: number; g: number; noise: number; planBoost: number }> = {
  prod_volume:    { base: 6500,  g: 20,    noise: 200,  planBoost: 30   },
  prod_plan_rate: { base: 88,    g: 0.15,  noise: 3,    planBoost: 0.2  },
  prod_oee:       { base: 72,    g: 0.1,   noise: 2,    planBoost: 0.15 },
  prod_downtime:  { base: 18,    g: -0.1,  noise: 3,    planBoost: -0.2 },
  sc_delivery:    { base: 87,    g: 0.12,  noise: 2.5,  planBoost: 0.2  },
  sc_inventory:   { base: 42,    g: -0.1,  noise: 3,    planBoost: -0.2 },
  sc_shortage:    { base: 3,     g: -0.03, noise: 0.8,  planBoost: -0.05},
  sc_cost:        { base: 105,   g: 0.05,  noise: 1.5,  planBoost: -0.1 },
  mfg_yield:      { base: 95.5,  g: 0.05,  noise: 0.8,  planBoost: 0.1  },
  mfg_scrap:      { base: 1.8,   g: -0.02, noise: 0.2,  planBoost: -0.03},
  mfg_cycle:      { base: 7.5,   g: -0.03, noise: 0.5,  planBoost: -0.05},
  mfg_labor:      { base: 9.5,   g: 0.05,  noise: 0.5,  planBoost: 0.08 },
  rd_milestone:   { base: 78,    g: 0.2,   noise: 4,    planBoost: 0.3  },
  rd_patent:      { base: 1.5,   g: 0.03,  noise: 0.5,  planBoost: 0.05 },
  rd_npi_cycle:   { base: 13,    g: -0.05, noise: 1,    planBoost: -0.1 },
  rd_spend:       { base: 3.8,   g: 0.02,  noise: 0.3,  planBoost: 0.04 },
  ql_ppm:         { base: 480,   g: -3,    noise: 40,   planBoost: -5   },
  ql_complaint:   { base: 9,     g: -0.08, noise: 1.5,  planBoost: -0.1 },
  ql_recall:      { base: 0.8,   g: -0.01, noise: 0.3,  planBoost: -0.02},
  ql_audit:       { base: 84,    g: 0.1,   noise: 2,    planBoost: 0.15 },
  pm_roadmap:     { base: 72,    g: 0.2,   noise: 4,    planBoost: 0.3  },
  pm_new_revenue: { base: 9,     g: 0.15,  noise: 1.5,  planBoost: 0.25 },
  pm_lifecycle:   { base: 60,    g: 0.15,  noise: 3,    planBoost: 0.2  },
  pm_gap:         { base: 42,    g: 0.2,   noise: 4,    planBoost: 0.3  },
  sl_revenue:     { base: 4200,  g: 40,    noise: 300,  planBoost: 60   },
  sl_win_rate:    { base: 24,    g: 0.15,  noise: 2.5,  planBoost: 0.2  },
  sl_coverage:    { base: 74,    g: 0.2,   noise: 3,    planBoost: 0.3  },
  sl_ltv_cac:     { base: 2.8,   g: 0.02,  noise: 0.2,  planBoost: 0.03 },
};

function genSeries(m: MetricDef, domainId: string, seed: number): MetricSeries {
  const r = rng(seed);
  const c = CFG[m.id] ?? { base: 70, g: 0.1, noise: 3, planBoost: 0.1 };

  // pre-generate actual history values for yoy/mom lookup
  const actuals: number[] = [];
  for (let i = 0; i < HIST_LEN; i++) {
    actuals.push(+(c.base + c.g * i + (r() - 0.5) * c.noise * 2).toFixed(2));
  }

  const points: MonthPoint[] = ALL_MONTHS.map((mo, idx) => {
    const isFuture = idx >= HIST_LEN;
    const planBase = c.base + (c.g + c.planBoost) * idx;
    const planned = +(planBase + (rng(seed + idx * 7)() - 0.5) * c.noise * 0.4).toFixed(2);
    const actual = isFuture ? null : actuals[idx];
    return {
      month: mo,
      actual,
      planned,
      yoy: !isFuture && idx >= 12 ? actuals[idx - 12] : null,
      mom: !isFuture && idx >= 1  ? actuals[idx - 1]  : null,
    };
  });

  return { metricId: m.id, domainId, points };
}

let _cache: MetricSeries[] | null = null;
export function getAllSeries(): MetricSeries[] {
  if (_cache) return _cache;
  let seed = 1000;
  const out: MetricSeries[] = [];
  DOMAINS.forEach((d) => d.metrics.forEach((m) => { out.push(genSeries(m, d.id, seed)); seed += 100; }));
  _cache = out;
  return out;
}

export function getSeries(metricId: string) {
  return getAllSeries().find((s) => s.metricId === metricId);
}

export function getSignal(value: number, def: MetricDef): MetricSignal {
  if (def.higherIsBetter) {
    return value >= def.greenThreshold ? "green" : value >= def.yellowThreshold ? "yellow" : "red";
  }
  return value <= def.greenThreshold ? "green" : value <= def.yellowThreshold ? "yellow" : "red";
}

export function getLatestActual(metricId: string): number | null {
  const s = getSeries(metricId);
  if (!s) return null;
  const a = s.points.filter((p) => p.actual !== null);
  return a.length ? a[a.length - 1].actual : null;
}
