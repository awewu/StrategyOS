"use client";

import { useState } from "react";
import { NavUserIcon } from "@/components/shell/NavIcons";
import { useRole, roleLabel } from "@/lib/context/role-context";
import { ROLES, type RoleKey } from "@/lib/constants";

/** Rail-width friendly labels (sidebar is 72px) */
const ROLE_SHORT: Record<RoleKey, string> = {
  ceo: "CEO",
  cfo: "CFO",
  vp: "负责人",
  system_head: "体系",
  pm: "项目",
  staff: "职能",
  observer: "观察",
};

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
  const [flyout, setFlyout] = useState(false);

  if (hidden) return null;

  function pickRole(next: RoleKey) {
    if (next !== role) {
      logRoleSwitch(role, next);
      setRole(next);
    }
    setFlyout(false);
  }

  if (compact) {
    return (
      <div
        className="stratos-role-rail"
        onMouseEnter={() => setFlyout(true)}
        onMouseLeave={() => setFlyout(false)}
      >
        <button
          type="button"
          className="stratos-role-rail__trigger"
          onClick={() => setFlyout((open) => !open)}
          aria-label={`当前角色：${roleLabel(role)}，点击切换`}
          aria-expanded={flyout}
          aria-haspopup="listbox"
        >
          <NavUserIcon className="stratos-nav-item__icon" />
          <span className="stratos-nav-item__label">{ROLE_SHORT[role]}</span>
        </button>
        {flyout ? (
          <div className="stratos-nav-flyout stratos-role-flyout" role="listbox" aria-label="切换角色">
            <p className="stratos-nav-flyout__title">切换角色</p>
            <ul className="stratos-nav-flyout__list">
              {(Object.keys(ROLES) as RoleKey[]).map((key) => (
                <li key={key}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={key === role}
                    className={`stratos-role-flyout__option ${key === role ? "stratos-nav-flyout__link--active" : ""}`}
                    onClick={() => pickRole(key)}
                  >
                    <span className="stratos-role-flyout__label">{roleLabel(key)}</span>
                    <span className="stratos-role-flyout__desc">{ROLES[key].desc}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
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
      className="rounded border border-[var(--surface-border)] bg-[var(--color-bg-deep)] px-2 py-1.5 text-xs text-[var(--color-text-muted)]"
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
