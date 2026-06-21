"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { roleHomePath } from "@/lib/auth/permissions";
import { ROLES, type RoleKey } from "@/lib/constants";

interface RoleContextValue {
  role: RoleKey;
  setRole: (role: RoleKey) => void;
}

const RoleContext = createContext<RoleContextValue | null>(null);

function persistRoleCookie(role: RoleKey) {
  document.cookie = `stratos_role=${role};path=/;max-age=31536000;SameSite=Lax`;
}

export function RoleProvider({
  children,
  initialRole = "ceo",
}: {
  children: ReactNode;
  initialRole?: RoleKey;
}) {
  const [role, setRoleState] = useState<RoleKey>(initialRole);

  function setRole(next: RoleKey) {
    setRoleState(next);
    persistRoleCookie(next);
  }

  return (
    <RoleContext.Provider value={{ role, setRole }}>{children}</RoleContext.Provider>
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
