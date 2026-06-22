import { AccessManagementPanel } from "@/components/admin/AccessManagementPanel";
import { logUsageEvent } from "@/lib/audit/log-event";
import { requireAdmin, getEffectiveSession } from "@/lib/auth/guard";
import { getAuditIntegrity, getRecentLogs, getUsers } from "@/lib/data/access-data";

export default async function AccessPage() {
  const effectiveRole = await requireAdmin();
  const session = await getEffectiveSession();

  await logUsageEvent({ action: "admin_view", resource: "/admin/access" });

  const [users, logs, integrity] = await Promise.all([
    getUsers(),
    getRecentLogs(50),
    getAuditIntegrity(),
  ]);

  return (
    <div className="stratos-page">
      <AccessManagementPanel
        users={users}
        logs={logs}
        integrity={integrity}
        session={session}
        effectiveRole={effectiveRole}
      />
    </div>
  );
}
