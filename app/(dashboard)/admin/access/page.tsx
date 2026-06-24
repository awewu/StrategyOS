import { AccessManagementPanelV2 } from "@/components/admin/AccessManagementPanelV2";
import { logUsageEvent } from "@/lib/audit/log-event";
import { requireAdmin, getEffectiveSession } from "@/lib/auth/guard";
import { loadPermissionConfigFromDb } from "@/lib/auth/permission-config";
import { getAuditIntegrity, getRecentLogs, getUsers } from "@/lib/data/access-data";
import { getOrgUnitsSummary } from "@/lib/data/org-units-access";

export default async function AccessPage() {
  const effectiveRole = await requireAdmin();
  const session = await getEffectiveSession();
  const permissionConfig = await loadPermissionConfigFromDb();

  await logUsageEvent({ action: "admin_view", resource: "/admin/access" });

  const [users, logs, integrity, orgUnits] = await Promise.all([
    getUsers(),
    getRecentLogs(50),
    getAuditIntegrity(),
    getOrgUnitsSummary(),
  ]);

  return (
    <div className="stratos-page">
      <AccessManagementPanelV2
        users={users}
        logs={logs}
        integrity={integrity}
        session={session}
        effectiveRole={effectiveRole}
        permissionConfig={permissionConfig}
        orgUnits={orgUnits}
      />
    </div>
  );
}
