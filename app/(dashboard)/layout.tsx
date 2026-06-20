import { cookies } from "next/headers";
import { DashboardShell } from "@/components/shell/DashboardShell";
import { getSession } from "@/lib/auth/session";
import { ROLES, type RoleKey } from "@/lib/constants";

function parseRole(value: string | undefined): RoleKey {
  if (value && value in ROLES) return value as RoleKey;
  return "ceo";
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const session = await getSession();
  const initialRole = parseRole(session?.role ?? cookieStore.get("stratos_role")?.value);

  return (
    <DashboardShell initialRole={initialRole} session={session}>
      {children}
    </DashboardShell>
  );
}
