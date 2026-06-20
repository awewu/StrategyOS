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
  createdAt: Date;
}

export const ACTION_LABELS: Record<UsageAction, string> = {
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
  workos_webhook: "WorkOS Webhook",
  hermes_scan: "Hermes 市场扫描",
};
