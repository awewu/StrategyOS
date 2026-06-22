import { DashboardShell } from "@/components/shell/DashboardShell";
import { DataSourceBanner } from "@/components/ui/DataSourceBanner";
import { getEffectiveRole } from "@/lib/auth/guard";
import { isDevBypassAuth } from "@/lib/auth/resolve-role";

/** DB-backed dashboard — skip SSG at build time to avoid connection storms / 60s timeouts. */
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const initialRole = await getEffectiveRole();
  const secureMode = process.env.STRATOS_REQUIRE_AUTH === "1";

  return (
    <DashboardShell
      initialRole={initialRole}
      secureMode={secureMode}
      devBypassAuth={isDevBypassAuth()}
    >
      <DataSourceBanner />
      {children}
    </DashboardShell>
  );
}
