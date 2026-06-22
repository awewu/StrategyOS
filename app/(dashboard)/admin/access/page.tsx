import { AccessManagementPanel } from "@/components/admin/AccessManagementPanel";
import { requireAdmin, getEffectiveSession } from "@/lib/auth/guard";
import { getRecentLogs, getUsers } from "@/lib/data/access-data";

export default async function AccessPage() {
  const effectiveRole = await requireAdmin();
  const session = await getEffectiveSession();

  const [users, logs] = await Promise.all([getUsers(), getRecentLogs(50)]);

  return (
    <div className="stratos-page">
      <AccessManagementPanel
        users={users}
        logs={logs}
        session={session}
        effectiveRole={effectiveRole}
      />
    </div>
  );
}
