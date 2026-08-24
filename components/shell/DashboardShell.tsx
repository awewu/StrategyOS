"use client";

import { Suspense, useEffect } from "react";
import type { RoleKey } from "@/lib/constants";
import type { ScopeSession } from "@/lib/auth/scope";
import { RoleProvider, useRole } from "@/lib/context/role-context";
import { AppNav } from "@/components/shell/AppNav";
import { AccessDeniedBanner } from "@/components/shell/AccessDeniedBanner";
import { DataSourceBanner } from "@/components/shell/DataSourceBanner";
import { CommandPalette } from "@/components/shell/CommandPalette";
import { HubSubNav } from "@/components/shell/HubSubNav";
import { LoopGuide } from "@/components/shell/LoopGuide";
import { PageGuide } from "@/components/shell/PageGuide";
import { NotificationsBell } from "@/components/shell/NotificationsBell";

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
  secureMode,
  devBypassAuth,
}: {
  children: React.ReactNode;
  initialRole: RoleKey;
  secureMode: boolean;
  devBypassAuth: boolean;
}) {
  return (
    <>
      <DevRoleSync initialRole={initialRole} devBypassAuth={devBypassAuth} />
      <div className="flex min-h-screen">
        <AppNav secureMode={secureMode} devBypassAuth={devBypassAuth} />
        <main className="stratos-shell-bg stratos-shell-main flex-1 min-w-0 min-h-screen px-[var(--page-gutter)] py-7 md:py-9 max-md:px-5">
          <div className="mx-auto w-full max-w-7xl">
            <Suspense fallback={null}>
              <AccessDeniedBanner />
            </Suspense>
            <DataSourceBanner />
            <LoopGuide />
            <HubSubNav />
            <PageGuide />
            {children}
          </div>
        </main>
        <NotificationsBell />
        <CommandPalette />
      </div>
    </>
  );
}

export function DashboardShell({
  children,
  initialRole,
  secureMode = false,
  devBypassAuth = false,
  sessionScope = null,
}: {
  children: React.ReactNode;
  initialRole: RoleKey;
  secureMode?: boolean;
  devBypassAuth?: boolean;
  sessionScope?: ScopeSession | null;
}) {
  return (
    <RoleProvider initialRole={initialRole} sessionScope={sessionScope}>
      <ShellInner
        initialRole={initialRole}
        secureMode={secureMode}
        devBypassAuth={devBypassAuth}
      >
        {children}
      </ShellInner>
    </RoleProvider>
  );
}
