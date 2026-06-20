"use client";

import type { SessionPayload } from "@/lib/auth/config";
import type { RoleKey } from "@/lib/constants";
import { RoleProvider } from "@/lib/context/role-context";
import { AppNav } from "@/components/shell/AppNav";
import { CommandPalette } from "@/components/shell/CommandPalette";

export function DashboardShell({
  children,
  initialRole,
  session,
}: {
  children: React.ReactNode;
  initialRole: RoleKey;
  session?: SessionPayload | null;
}) {
  return (
    <RoleProvider initialRole={initialRole}>
      <div className="flex min-h-screen">
        <AppNav session={session} />
        <main className="stratos-shell-bg stratos-grid-bg ml-14 flex-1 px-8 py-8 min-h-screen">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
        <CommandPalette showAccess={initialRole === "ceo" || initialRole === "staff"} />
      </div>
    </RoleProvider>
  );
}
