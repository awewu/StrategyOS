"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
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

export function roleHomePath(role: RoleKey): string {
  switch (role) {
    case "ceo":
    case "observer":
      return "/command";
    case "vp":
      return "/strategy";
    case "pm":
      return "/execution";
    case "staff":
      return "/reports";
    default:
      return "/command";
  }
}

export function roleLabel(role: RoleKey): string {
  return ROLES[role].label;
}
