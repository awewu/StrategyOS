import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AccessManagementPanel } from "@/components/admin/AccessManagementPanel";
import { getSession } from "@/lib/auth/session";
import { getRecentLogs, getUsers } from "@/lib/data/access-data";
import { ROLES, type RoleKey } from "@/lib/constants";

function parseRole(value: string | undefined): RoleKey {
  if (value && value in ROLES) return value as RoleKey;
  return "observer";
}

export default async function AccessPage() {
  const session = await getSession();
  const cookieStore = await cookies();
  const effectiveRole = session?.role ?? parseRole(cookieStore.get("stratos_role")?.value);

  if (effectiveRole !== "ceo" && effectiveRole !== "staff") {
    redirect("/command");
  }

  const [users, logs] = await Promise.all([getUsers(), getRecentLogs(50)]);

  return (
    <AccessManagementPanel
      users={users}
      logs={logs}
      session={session}
      effectiveRole={effectiveRole}
    />
  );
}
