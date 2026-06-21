import { cookies } from "next/headers";
import { DashboardShell } from "@/components/shell/DashboardShell";
import { getEffectiveRole } from "@/lib/auth/guard";
import { isDevBypassAuth } from "@/lib/auth/resolve-role";
import { getSession } from "@/lib/auth/session";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const initialRole = await getEffectiveRole();
  const secureMode = process.env.STRATOS_REQUIRE_AUTH === "1";

  return (
    <DashboardShell
      initialRole={initialRole}
      session={session}
      secureMode={secureMode}
      devBypassAuth={isDevBypassAuth()}
    >
      {children}
    </DashboardShell>
  );
}
