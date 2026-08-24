"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { ROLES, type RoleKey } from "@/lib/constants";
import type { ScopeSession } from "@/lib/auth/scope";

interface RoleContextValue {
  role: RoleKey;
  setRole: (role: RoleKey) => void;
  /** Real per-user scope from the session (org unit / project), if authenticated. */
  sessionScope: ScopeSession | null;
}

const RoleContext = createContext<RoleContextValue | null>(null);

function persistRoleCookie(role: RoleKey) {
  document.cookie = `stratos_role=${role};path=/;max-age=31536000;SameSite=Lax`;
}

export function RoleProvider({
  children,
  initialRole = "ceo",
  sessionScope = null,
}: {
  children: ReactNode;
  initialRole?: RoleKey;
  sessionScope?: ScopeSession | null;
}) {
  const [role, setRoleState] = useState<RoleKey>(initialRole);

  function setRole(next: RoleKey) {
    setRoleState(next);
    persistRoleCookie(next);
  }

  return (
    <RoleContext.Provider value={{ role, setRole, sessionScope }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}

export { roleHomePath } from "@/lib/auth/permissions";

export function roleLabel(role: RoleKey): string {
  return ROLES[role].label;
}
