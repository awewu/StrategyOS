export const USAGE_ACTIONS = [
  "login",
  "logout",
  "auth_failed",
  "report_parse",
  "agent_orchestrate",
  "snapshot_freeze",
  "spbp_update",
  "pdf_download",
  "role_switch",
  "counterfactual_run",
  "rehearsal_checklist",
  "diff_persist",
  "workos_webhook",
  "hermes_scan",
  "fpa_view",
  "innovation_view",
  "ma_view",
  "admin_view",
  "audit_export",
  "data_source_read",
  "permission_update",
  "import_commit",
  "budget_version_update",
  "commitment_update",
  "commitment_nudge",
  "board_resolution_sign",
  "board_pack_lock",
] as const;

export type UsageAction = (typeof USAGE_ACTIONS)[number];

export interface UsageLogRecord {
  id: string;
  userId?: string;
  userEmail: string;
  action: UsageAction | string;
  resource: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  prevHash?: string;
  hash?: string;
  createdAt: Date;
}

export const ACTION_LABELS: Partial<Record<UsageAction, string>> = {
  login: "登录",
  logout: "登出",
  auth_failed: "登录失败",
  report_parse: "报告解析",
  agent_orchestrate: "Agent 编排",
  snapshot_freeze: "快照定稿",
  spbp_update: "SPBP 更新",
  pdf_download: "PDF 下载",
  role_switch: "角色切换",
  counterfactual_run: "反事实推演",
  rehearsal_checklist: "彩排清单",
  diff_persist: "Diff 持久化",
  import_commit: "Sheet 导入入库",
  budget_version_update: "预算版本流转",
  commitment_update: "承诺状态更新",
  commitment_nudge: "承诺催办",
  board_resolution_sign: "董事决议签署",
  board_pack_lock: "上会材料锁定",
  workos_webhook: "WorkOS Webhook",
  hermes_scan: "Hermes 市场扫描",
  fpa_view: "FPA 财务查看",
  admin_view: "管理后台查看",
  audit_export: "审计日志导出",
  data_source_read: "数据来源查看",
};
