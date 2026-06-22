"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { SessionPayload } from "@/lib/auth/config";
import { canAccessHub, filterNavHref, isAdmin, roleHomePath } from "@/lib/auth/permissions";
import { brand } from "@/lib/brand/tokens";
import { RoleSwitcher } from "@/components/shell/RoleSwitcher";
import { NavIcon, type NavIconId } from "@/components/shell/NavIcons";
import { InboxNavBadge } from "@/components/shell/InboxNavBadge";
import {
  NAV_ACCESS,
  NAV_MONITOR_HUB,
  NAV_OPS_HUB,
  NAV_PRIMARY_HUBS,
  NAV_TOOLS_HUB,
  NAV_STANDALONE,
  hubContainsPath,
  isStandaloneActive,
  matchesNavRoute,
  type NavHub,
} from "@/lib/nav/hubs";
import { useRole } from "@/lib/context/role-context";
import type { RoleKey } from "@/lib/auth/permissions";

function filterHubForRole(hub: NavHub, role: RoleKey): NavHub | null {
  if (!canAccessHub(role, hub.id)) return null;
  const children = hub.children.filter((c) => filterNavHref(role, c.href));
  if (children.length === 0) return null;
  const defaultHref =
    children.find((c) => c.href === hub.defaultHref)?.href ??
    children.find((c) => filterNavHref(role, c.href))?.href ??
    children[0]!.href;
  return { ...hub, children, defaultHref };
}

function RailNavItem({
  href,
  shortLabel,
  icon,
  active,
  title,
}: {
  href: string;
  shortLabel: string;
  icon: NavIconId;
  active: boolean;
  title?: string;
}) {
  return (
    <Link
      href={href}
      className={`stratos-nav-item ${active ? "stratos-nav-item--active" : ""}`}
      title={title ?? shortLabel}
    >
      <NavIcon id={icon} className="stratos-nav-item__icon" />
      <span className="stratos-nav-item__label">{shortLabel}</span>
    </Link>
  );
}

function HubFlyout({
  hub,
  pathname,
  open,
}: {
  hub: NavHub;
  pathname: string;
  open: boolean;
}) {
  if (!open || hub.children.length === 0) return null;

  return (
    <div className="stratos-nav-flyout" role="menu">
      <p className="stratos-nav-flyout__title">{hub.label}</p>
      <ul className="stratos-nav-flyout__list">
        {hub.children.map((item) => {
          const active = matchesNavRoute(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`stratos-nav-flyout__link ${active ? "stratos-nav-flyout__link--active" : ""}`}
                role="menuitem"
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function HubNavItem({
  hub,
  pathname,
  role,
}: {
  hub: NavHub;
  pathname: string;
  role: ReturnType<typeof useRole>["role"];
}) {
  const [flyout, setFlyout] = useState(false);
  const active = hubContainsPath(hub, pathname);

  const defaultHref =
    hub.children.find((c) => canAccessRoute(role, c.href.split("?")[0]!))?.href ??
    hub.defaultHref;

  return (
    <div
      className="stratos-nav-hub"
      onMouseEnter={() => setFlyout(true)}
      onMouseLeave={() => setFlyout(false)}
    >
      <Link
        href={defaultHref}
        className={`stratos-nav-item ${active ? "stratos-nav-item--active" : ""}`}
        title={hub.label}
      >
        <NavIcon id={hub.icon} className="stratos-nav-item__icon" />
        {hub.id === "posture" ? <InboxNavBadge /> : null}
        <span className="stratos-nav-item__label">{hub.shortLabel}</span>
      </Link>
      <HubFlyout hub={hub} pathname={pathname} open={flyout} />
    </div>
  );
}

export function AppNav({
  session,
  secureMode = false,
  devBypassAuth = false,
}: {
  session?: SessionPayload | null;
  secureMode?: boolean;
  devBypassAuth?: boolean;
}) {
  const pathname = usePathname();
  const { role } = useRole();
  const home = roleHomePath(role);
  const showAccess = isAdmin(role);

  const standalone = NAV_STANDALONE.filter((item) => filterNavHref(role, item.href));
  const primaryHubs = NAV_PRIMARY_HUBS.map((h) => filterHubForRole(h, role)).filter(Boolean) as NavHub[];
  const bottomHubs = [NAV_OPS_HUB, NAV_MONITOR_HUB, NAV_TOOLS_HUB]
    .map((h) => filterHubForRole(h, role))
    .filter(Boolean) as NavHub[];

  return (
    <aside className="stratos-sidebar">
      <Link href={home} className="stratos-sidebar__logo" title={brand.sidebarLabelZh}>
        <span className="stratos-sidebar__mark" aria-hidden>
          {brand.markName}
        </span>
        <span className="stratos-sidebar__wordmark">{brand.sidebarLabelZh}</span>
      </Link>

      <nav className="stratos-sidebar__nav">
        {primaryHubs.map((hub) => (
          <HubNavItem key={hub.id} hub={hub} pathname={pathname} role={role} />
        ))}

        {standalone.length > 0 ? <div className="stratos-sidebar__divider" /> : null}

        {standalone.map((item) => (
          <RailNavItem
            key={item.href}
            href={item.href}
            shortLabel={item.shortLabel}
            icon={item.icon}
            active={isStandaloneActive(pathname, item.href)}
            title={item.label}
          />
        ))}

        {bottomHubs.length > 0 ? <div className="stratos-sidebar__divider" /> : null}

        {bottomHubs.map((hub) => (
          <HubNavItem key={hub.id} hub={hub} pathname={pathname} role={role} />
        ))}

        {showAccess ? (
          <RailNavItem
            href={NAV_ACCESS.href}
            shortLabel={NAV_ACCESS.shortLabel}
            icon={NAV_ACCESS.icon}
            active={pathname.startsWith(NAV_ACCESS.href)}
            title={NAV_ACCESS.label}
          />
        ) : null}
      </nav>

      <div className="stratos-sidebar__foot">
        <RoleSwitcher compact hidden={secureMode && Boolean(session) && !devBypassAuth} />
        <kbd className="stratos-sidebar__kbd" title="⌘K 命令面板">
          ⌘K
        </kbd>
      </div>
    </aside>
  );
}
