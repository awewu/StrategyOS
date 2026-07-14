import Link from "next/link";
import { issueStatusLabel, type ReportReceipt } from "@/lib/reports/receipts";

const APPROVAL_LABEL: Record<string, { text: string; color: string }> = {
  PENDING: { text: "待审阅", color: "var(--signal-yellow)" },
  APPROVED: { text: "已通过", color: "var(--signal-green)" },
  REJECTED: { text: "已退回", color: "var(--signal-red)" },
};

const ISSUE_COLOR: Record<string, string> = {
  OPEN: "var(--signal-yellow)",
  DEFERRED: "var(--color-text-muted)",
  ASSIGNED: "var(--color-accent)",
  CLOSED: "var(--signal-green)",
};

/** 报告→议题回执面板："我交了有没有用"的反馈闭环 */
export function ReportReceipts({ receipts }: { receipts: ReportReceipt[] }) {
  if (receipts.length === 0) return null;

  return (
    <section className="stratos-card stratos-card--padded">
      <h2 className="text-title text-[var(--color-text-primary)]">提交回执</h2>
      <p className="text-caption mt-1 mb-4">
        你的报告解析出了什么议题、进了谁的收件箱、裁决到哪一步
      </p>
      <div className="space-y-3">
        {receipts.map((r) => {
          const approval = APPROVAL_LABEL[r.approvalStatus] ?? APPROVAL_LABEL.PENDING;
          return (
            <div key={r.reportId} className="rounded-lg border border-[var(--surface-border)] p-4">
              <div className="flex flex-wrap items-baseline gap-3 text-sm">
                <span className="font-medium text-[var(--color-text-primary)]">{r.title}</span>
                <span className="text-xs text-[var(--color-text-muted)]">{r.period} · 提交 {r.uploadedAt}</span>
                <span className="text-xs" style={{ color: approval.color }}>{approval.text}</span>
                <span className="text-xs text-[var(--color-text-muted)]">
                  {r.parsed ? `已解析 · ${r.triggerCount} 个触发信号` : "未解析"}
                </span>
              </div>
              {r.issues.length > 0 ? (
                <div className="mt-3 space-y-1.5">
                  {r.issues.map((issue) => (
                    <div key={issue.sourceKey} className="flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className="inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full"
                        style={{ backgroundColor: ISSUE_COLOR[issue.status] }}
                      />
                      <span className="flex-1 text-[var(--color-text-secondary)]">{issue.title}</span>
                      <span style={{ color: ISSUE_COLOR[issue.status] }}>{issueStatusLabel(issue.status)}</span>
                      {issue.ownerName ? (
                        <span className="text-[var(--color-text-muted)]">→ {issue.ownerName}</span>
                      ) : null}
                      {issue.resolution ? (
                        <span className="text-[var(--color-text-muted)]">（{issue.resolution}）</span>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : r.parsed ? (
                <p className="mt-2 text-xs text-[var(--color-text-muted)]">未触发议题 — 数据在控</p>
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="mt-4 text-caption">
        <Link href="/inbox" className="text-[var(--color-accent)] hover:underline">
          议题 Inbox 全览 →
        </Link>
      </div>
    </section>
  );
}
