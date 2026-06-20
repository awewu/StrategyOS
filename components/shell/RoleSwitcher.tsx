"use client";

import { useRole, roleLabel } from "@/lib/context/role-context";
import { ROLES, type RoleKey } from "@/lib/constants";

function logRoleSwitch(from: RoleKey, to: RoleKey) {
  fetch("/api/audit/log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "role_switch",
      resource: `${from}→${to}`,
      metadata: { from, to },
    }),
  }).catch(() => {});
}

export function RoleSwitcher({ compact }: { compact?: boolean }) {
  const { role, setRole } = useRole();

  if (compact) {
    return (
      <select
        value={role}
        onChange={(e) => {
          const next = e.target.value as RoleKey;
          if (next !== role) { logRoleSwitch(role, next); setRole(next); }
        }}
        title={`当前角色：${roleLabel(role)}`}
        className="h-9 w-9 cursor-pointer appearance-none rounded-md bg-transparent text-center text-[11px] text-[var(--color-text-muted)] hover:bg-black/[0.05] focus:outline-none"
        aria-label="切换角色"
      >
        {(Object.keys(ROLES) as RoleKey[]).map((key) => (
          <option key={key} value={key}>{roleLabel(key)}</option>
        ))}
      </select>
    );
  }

  return (
    <select
      value={role}
      onChange={(e) => {
        const next = e.target.value as RoleKey;
        if (next !== role) {
          logRoleSwitch(role, next);
          setRole(next);
        }
      }}
      className="rounded border border-black/10 bg-[var(--color-bg-deep)] px-2 py-1.5 text-xs text-[var(--color-text-muted)]"
      aria-label="切换角色"
    >
      {(Object.keys(ROLES) as RoleKey[]).map((key) => (
        <option key={key} value={key}>
          {roleLabel(key)}
        </option>
      ))}
    </select>
  );
}
