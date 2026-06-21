import type { TrafficLight } from "@/lib/types/stratos";

export type BscDimensionRow = {
  dim: string;
  objective: string;
  mustWin: string;
  operating: string[];
  mustNotFail: string;
  mustWinStatus: TrafficLight;
  notFailStatus: TrafficLight;
};

export const BSC_MAP: BscDimensionRow[] = [
  {
    dim: "财务",
    objective: "投资驱动增长 · 营收 6000 万路径",
    mustWin: "营收 CAGR ≥ 15%",
    operating: ["ROS 11.2%（当期）", "EBITDA 884 万", "H1 CAPEX 62% 执行"],
    mustNotFail: "Runway < 3 月 → HardBlock",
    mustWinStatus: "yellow",
    notFailStatus: "red",
  },
  {
    dim: "客户",
    objective: "酒店 1200 家 · 科技住宅渗透",
    mustWin: "战略段 NPS ≥ 45",
    operating: ["酒店签约 820/1200", "覆盖 82% P0 段", "LTV:CAC 18:1（黄）"],
    mustNotFail: "P0 段 coverage 三态任一缺失",
    mustWinStatus: "yellow",
    notFailStatus: "yellow",
  },
  {
    dim: "流程",
    objective: "V4 平台按时上市 · Gate 全过",
    mustWin: "V4 Q4 平台冻结",
    operating: ["准时率 85% 目标", "IC-04 产线 review", "TRL 6→8 路径"],
    mustNotFail: "H3 赌注无 kill_criteria",
    mustWinStatus: "red",
    notFailStatus: "green",
  },
  {
    dim: "学习",
    objective: "单王 5 人 · 组织能力建设",
    mustWin: "5/5 关键岗位到位",
    operating: ["流失率 ≤ 10%", "涌现吸收率 R6", "培训投入联动 FPA"],
    mustNotFail: "V6 未启动且无 defer 记录",
    mustWinStatus: "yellow",
    notFailStatus: "yellow",
  },
];
