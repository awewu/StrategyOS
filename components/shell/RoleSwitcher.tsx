"use client";

import { NavUserIcon } from "@/components/shell/NavIcons";
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

export function RoleSwitcher({ compact, hidden }: { compact?: boolean; hidden?: boolean }) {
  const { role, setRole } = useRole();

  if (hidden) return null;

  if (compact) {
    return (
      <div className="stratos-role-rail" title={`当前角色：${roleLabel(role)}`}>
        <NavUserIcon className="stratos-nav-item__icon" />
        <select
          value={role}
          onChange={(e) => {
            const next = e.target.value as RoleKey;
            if (next !== role) {
              logRoleSwitch(role, next);
              setRole(next);
            }
          }}
          className="stratos-role-rail__select"
          aria-label="切换角色"
        >
          {(Object.keys(ROLES) as RoleKey[]).map((key) => (
            <option key={key} value={key}>
              {roleLabel(key)}
            </option>
          ))}
        </select>
      </div>
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
