import { DashboardShell } from "@/components/shell/DashboardShell";
import { getEffectiveRole } from "@/lib/auth/guard";
import { getSession } from "@/lib/auth/session";
import { isDevBypassAuth } from "@/lib/auth/resolve-role";

/** DB-backed dashboard — skip SSG at build time to avoid connection storms / 60s timeouts. */
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const initialRole = await getEffectiveRole();
  const session = await getSession();
  const secureMode = process.env.STRATOS_REQUIRE_AUTH === "1";

  const sessionScope = session
    ? {
        orgUnitId: session.orgUnitId ?? null,
        orgScopeIds: session.orgScopeIds ?? null,
        projectCode: session.projectCode ?? null,
      }
    : null;

  return (
    <DashboardShell
      initialRole={initialRole}
      secureMode={secureMode}
      devBypassAuth={isDevBypassAuth()}
      sessionScope={sessionScope}
    >
      {children}
    </DashboardShell>
  );
}
