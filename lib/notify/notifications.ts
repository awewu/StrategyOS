import { dbAvailable, prisma } from "@/lib/db";
import { roleToLevel, type RoleKey } from "@/lib/auth/permissions";
import { getImportFreshness } from "@/lib/finance/import-freshness";

/** 站内通知聚合：把"该你动了"的异常推给对应角色，而不是等人打开页面 */

export type Notification = {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  href: string;
};

export async function computeNotifications(role: RoleKey, myName?: string): Promise<Notification[]> {
  const level = roleToLevel(role);
  if (!(await dbAvailable())) return [];
  const items: Notification[] = [];
  const now = new Date();

  // L1+ 承诺逾期（我名下优先，其次全量计数）
  if (level >= 1) {
    const overdueWhere = { deadline: { lt: now }, status: { not: "completed" as const } };
    const [mineOverdue, allOverdue] = await Promise.all([
      myName
        ? prisma.commitment.count({ where: { ...overdueWhere, ownerName: myName } })
        : Promise.resolve(0),
      prisma.commitment.count({ where: overdueWhere }),
    ]);
    if (mineOverdue > 0) {
      items.push({
        id: "overdue-mine",
        severity: "critical",
        title: `你名下 ${mineOverdue} 项承诺已逾期`,
        href: "/cockpit",
      });
    } else if (allOverdue > 0 && level >= 2) {
      items.push({
        id: "overdue-team",
        severity: "warning",
        title: `本组织 ${allOverdue} 项承诺逾期`,
        href: "/cockpit",
      });
    }
  }

  // L3 预算待审
  if (level >= 3) {
    const pendingBudgets = await prisma.finBudgetVersion.count({ where: { status: "submitted" } });
    if (pendingBudgets > 0) {
      items.push({
        id: "budget-pending",
        severity: "warning",
        title: `${pendingBudgets} 个预算版本待审批`,
        href: "/finance/ledger?tab=budget",
      });
    }
  }

  // L3 critical 议题待裁决
  if (level >= 3) {
    const criticalOpen = await prisma.inboxRecord.count({
      where: { status: "OPEN", severity: "critical" },
    });
    if (criticalOpen > 0) {
      items.push({
        id: "inbox-critical",
        severity: "critical",
        title: `${criticalOpen} 条 critical 议题待裁决`,
        href: "/command/issues",
      });
    }
  }

  // L2+ 期次水位：该导数了
  if (level >= 2) {
    const fresh = await getImportFreshness();
    if (fresh.available && fresh.stale) {
      items.push({
        id: "import-stale",
        severity: "warning",
        title: `该导数了 · 当前期 ${fresh.activePeriod}，总账停在 ${fresh.latestLedgerPeriod ?? "未导入"}`,
        href: "/tools/import",
      });
    }
  }

  const order = { critical: 0, warning: 1, info: 2 };
  return items.sort((a, b) => order[a.severity] - order[b.severity]);
}
