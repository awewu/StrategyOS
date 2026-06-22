"use client";

import { Suspense, useEffect } from "react";
import type { SessionPayload } from "@/lib/auth/config";
import type { RoleKey } from "@/lib/constants";
import { RoleProvider, useRole } from "@/lib/context/role-context";
import { AppNav } from "@/components/shell/AppNav";
import { AccessDeniedBanner } from "@/components/shell/AccessDeniedBanner";
import { CommandPalette } from "@/components/shell/CommandPalette";
import { HubSubNav } from "@/components/shell/HubSubNav";

function DevRoleSync({
  initialRole,
  devBypassAuth,
}: {
  initialRole: RoleKey;
  devBypassAuth: boolean;
}) {
  const { setRole } = useRole();

  useEffect(() => {
    if (!devBypassAuth) return;
    document.cookie = `stratos_role=${initialRole};path=/;max-age=31536000;SameSite=Lax`;
    setRole(initialRole);
  }, [devBypassAuth, initialRole, setRole]);

  return null;
}

function ShellInner({
  children,
  initialRole,
  session,
  secureMode,
  devBypassAuth,
}: {
  children: React.ReactNode;
  initialRole: RoleKey;
  session?: SessionPayload | null;
  secureMode: boolean;
  devBypassAuth: boolean;
}) {
  return (
    <>
      <DevRoleSync initialRole={initialRole} devBypassAuth={devBypassAuth} />
      <div className="flex min-h-screen">
        <AppNav session={session} secureMode={secureMode} devBypassAuth={devBypassAuth} />
        <main className="stratos-shell-bg stratos-shell-main flex-1 min-h-screen px-5 py-7 md:px-10 md:py-9">
          <div className="mx-auto max-w-[72rem]">
            <Suspense fallback={null}>
              <AccessDeniedBanner />
            </Suspense>
            <HubSubNav />
            {children}
          </div>
        </main>
        <CommandPalette />
      </div>
    </>
  );
}

export function DashboardShell({
  children,
  initialRole,
  session,
  secureMode = false,
  devBypassAuth = false,
}: {
  children: React.ReactNode;
  initialRole: RoleKey;
  session?: SessionPayload | null;
  secureMode?: boolean;
  devBypassAuth?: boolean;
}) {
  return (
    <RoleProvider initialRole={initialRole}>
      <ShellInner
        initialRole={initialRole}
        session={session}
        secureMode={secureMode}
        devBypassAuth={devBypassAuth}
      >
        {children}
      </ShellInner>
    </RoleProvider>
  );
}
