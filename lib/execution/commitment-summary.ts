import type { CommitmentRecord } from "./tension-analysis";

export interface CommitmentSummary {
  total: number;
  done: number;
  overdue: number;
  inflight: number;
  rate: number;
  maxDaysOverdue: number;
}

/** Single source of truth for commitment-fulfillment derivation (账本/监测/驾驶舱 共用). */
export function computeCommitmentSummary(records: CommitmentRecord[]): CommitmentSummary {
  const total = records.length;
  const done = records.filter((c) => c.status === "completed").length;
  const overdue = records.filter((c) => c.status === "overdue").length;
  const inflight = total - done - overdue;
  const rate = total ? Math.round((done / total) * 100) : 0;
  const maxDaysOverdue = records.reduce((m, c) => Math.max(m, c.daysOverdue ?? 0), 0);
  return { total, done, overdue, inflight, rate, maxDaysOverdue };
}

/** Fulfillment-rate color: ≥70 green · ≥50 amber · else red. */
export function fulfillmentRateColor(rate: number): string {
  if (rate >= 70) return "var(--signal-green)";
  if (rate >= 50) return "var(--signal-amber, #d97706)";
  return "var(--signal-red)";
}
