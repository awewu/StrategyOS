/**
 * 战略-执行张力分析数据层
 * 基于 Sull & Eisenhardt 四类张力理论
 */

export type TensionType = "direction" | "resource" | "capability" | "adaptation";

export interface TensionItem {
  id: string;
  projectCode: string;
  projectName: string;
  tensionType: TensionType;
  signal: string;
  diagnosis: string;
  recommendation: string;
  severity: "low" | "medium" | "high";
  linkedAssumptionCode?: string;
  linkedKr?: string;
}

export interface CommitmentRecord {
  id: string;
  owner: string;
  department: string;
  content: string;
  deadline: string;
  status: "completed" | "overdue" | "in_progress" | "pending";
  daysOverdue?: number;
  promiseTo?: string;
  linkedProjectCode?: string;
  linkedAssumptionCode?: string;
  linkedKrId?: string;
}

export interface ExecutionMaturityPoint {
  projectCode: string;
  projectName: string;
  owner: string;
  milestoneOnTimeRate: number;
  assumptionHitRate: number;
  responseLatencyDays: number;
  budgetTotal: number;
  tensionType: TensionType;
  horizon: string;
}

export const TENSION_META: Record<TensionType, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  rootCause: string;
  wrongResponse: string;
  rightResponse: string;
}> = {
  direction: {
    label: "方向张力",
    color: "#f97316",
    bgColor: "bg-orange-900/20",
    borderColor: "border-orange-500/40",
    rootCause: "KR 设错方向，执行正确但目标偏离战略",
    wrongResponse: "催进度、加资源",
    rightResponse: "重新校准 KR，检查与 Diagnosis.crux 对齐",
  },
  resource: {
    label: "资源张力",
    color: "#8b5cf6",
    bgColor: "bg-violet-900/20",
    borderColor: "border-violet-500/40",
    rootCause: "资源分配与优先级不符，高价值项目缺口",
    wrongResponse: "增加工作量压力",
    rightResponse: "重配预算/人力，停低优先级项目释放资源",
  },
  capability: {
    label: "能力张力",
    color: "#ef4444",
    bgColor: "bg-red-900/20",
    borderColor: "border-red-500/40",
    rootCause: "组织能力缺口，同类问题反复出现",
    wrongResponse: "换人、问责",
    rightResponse: "系统性能力建设，引入外部能力或合作",
  },
  adaptation: {
    label: "适应张力",
    color: "#eab308",
    bgColor: "bg-yellow-900/20",
    borderColor: "border-yellow-500/40",
    rootCause: "假设已失效但战略/OKR 未更新",
    wrongResponse: "继续按原计划推进",
    rightResponse: "触发诊断重检，更新假设，同步调整 OKR",
  },
};

export const demoTensions: TensionItem[] = [
  {
    id: "t1", projectCode: "V4", projectName: "热泵新品上市",
    tensionType: "capability",
    signal: "样机测试通过率 72%，目标 100%，已延期两个月",
    diagnosis: "产品化能力缺口——热泵系统集成经验不足，非执行懈怠",
    recommendation: "引入外部集成顾问，并行建立内部能力，而非单纯催进度",
    severity: "high", linkedKr: "V4 样机测试通过率",
  },
  {
    id: "t2", projectCode: "V1", projectName: "恒热渠道升级",
    tensionType: "direction",
    signal: "KR 达成 78%，但签约量同比未增长",
    diagnosis: "KR 度量渠道覆盖数量，战略目标是签约质量，方向错位",
    recommendation: "将 KR 从「覆盖家数」改为「A 级经销商占比 + 单店产出」",
    severity: "medium", linkedAssumptionCode: "H5", linkedKr: "Q2 华东新签 80 家",
  },
  {
    id: "t3", projectCode: "V6", projectName: "区域 M&A 预研",
    tensionType: "adaptation",
    signal: "预研进度 0%，竞争格局出现不确定信号",
    diagnosis: "H2 假设（史密斯不降价）如失效，M&A 估值逻辑根本改变",
    recommendation: "触发 Diagnosis 重检，评估假设前提是否仍成立后再推进",
    severity: "high", linkedAssumptionCode: "H2",
  },
  {
    id: "t4", projectCode: "V4", projectName: "热泵新品上市",
    tensionType: "resource",
    signal: "V4 预算执行 63%，已超支，挤压其他 H1 项目可用资源",
    diagnosis: "资本分配与优先级倒置，高优先级项目超支未经 Gate 审批",
    recommendation: "将 V4 追加预算纳入 IC Gate 正式审批，重配 CapStack H2 资源",
    severity: "medium",
  },
];

export const demoMaturityPoints: ExecutionMaturityPoint[] = [
  {
    projectCode: "V4", projectName: "热泵新品上市", owner: "张健",
    milestoneOnTimeRate: 0.42, assumptionHitRate: 0.55, responseLatencyDays: 18,
    budgetTotal: 150, tensionType: "capability", horizon: "H2",
  },
  {
    projectCode: "V1", projectName: "恒热渠道升级", owner: "毕韬",
    milestoneOnTimeRate: 0.82, assumptionHitRate: 0.70, responseLatencyDays: 6,
    budgetTotal: 180, tensionType: "direction", horizon: "H1",
  },
  {
    projectCode: "V6", projectName: "区域M&A预研", owner: "战略组",
    milestoneOnTimeRate: 0.10, assumptionHitRate: 0.30, responseLatencyDays: 45,
    budgetTotal: 50, tensionType: "adaptation", horizon: "H3",
  },
];

export const demoCommitments: CommitmentRecord[] = [
  { id: "c1", owner: "张健",   department: "研发中心", content: "V4 样机完成 EMC 测试",          deadline: "2026-Q2", status: "overdue",     daysOverdue: 21, linkedProjectCode: "V4" },
  { id: "c2", owner: "毕韬",   department: "销售管理", content: "华东新增 A 级经销商 ≥15 家",    deadline: "2026-Q2", status: "completed",                    linkedProjectCode: "V1" },
  { id: "c3", owner: "CFO",   department: "财务",     content: "CapStack H2 预算重配方案提交",  deadline: "2026-Q2", status: "overdue",     daysOverdue: 7,  linkedProjectCode: "V4" },
  { id: "c4", owner: "战略组", department: "战略",     content: "M&A 目标标的初步尽调报告",     deadline: "2026-Q2", status: "in_progress",                   linkedProjectCode: "V6" },
  { id: "c5", owner: "张健",   department: "研发中心", content: "V4 供应商定点确认",            deadline: "2026-Q1", status: "completed",                    linkedProjectCode: "V4" },
  { id: "c6", owner: "毕韬",   department: "销售管理", content: "酒店渠道专项培训完成",         deadline: "2026-Q1", status: "overdue",     daysOverdue: 35, linkedAssumptionCode: "H5" },
  { id: "c7", owner: "HR",    department: "人力资源", content: "研发关键岗位招募完成 80%",      deadline: "2026-Q2", status: "in_progress",                   linkedProjectCode: "V4" },
  { id: "c8", owner: "COO",   department: "运营",     content: "供应链产能缺口应对方案",        deadline: "2026-Q2", status: "pending" },
];
