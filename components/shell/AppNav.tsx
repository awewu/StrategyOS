"use client";

/**
 * Primary sidebar navigation — closed-loop lifecycle sections, ALL destinations
 * always visible per role permissions. No hover-flyout, no「更多」collapse that
 * hides modules (that paradigm caused recurring "modules lost" UX failures).
 * Sections can be collapsed by the user for density, but the active section is
 * always forced open so the current location's siblings stay discoverable.
 * @see docs/STRATOS-ROLE-OPERATION-LOOPS.md Part C
 */
import { RhauttSidebarLogo } from "@/components/brand/RhauttSidebarLogo";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { canAccessRoute, filterNavHref, isAdmin, roleHomePath } from "@/lib/auth/permissions";
import { brand } from "@/lib/brand/tokens";
import { RoleSwitcher } from "@/components/shell/RoleSwitcher";
import { NavIcon, NavLogoutIcon, type NavIconId } from "@/components/shell/NavIcons";
import { InboxNavBadge } from "@/components/shell/InboxNavBadge";
import {
  NAV_ACCESS,
  NAV_HUBS,
  NAV_STANDALONE,
  hubContainsPath,
  isStandaloneActive,
  matchesNavRoute,
  type NavHub,
} from "@/lib/nav/hubs";
import { useRole } from "@/lib/context/role-context";
import type { RoleKey } from "@/lib/auth/permissions";
import { canAccessHub } from "@/lib/auth/permissions";

function filterHubForRole(hub: NavHub, role: RoleKey): NavHub | null {
  if (!canAccessHub(role, hub.id)) return null;
  const children = hub.children.filter((c) => filterNavHref(role, c.href));
  if (children.length === 0) return null;
  const defaultHref =
    children.find((c) => c.href === hub.defaultHref)?.href ??
    children.find((c) => canAccessRoute(role, c.href.split("?")[0]!))?.href ??
    children[0]!.href;
  return { ...hub, children, defaultHref };
}

function NavLeaf({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: NavIconId;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`stratos-nav-leaf ${active ? "stratos-nav-leaf--active" : ""}`}
      title={label}
    >
      <NavIcon id={icon} className="stratos-nav-leaf__icon" />
      <span className="stratos-nav-leaf__label">{label}</span>
    </Link>
  );
}

function NavSection({
  hub,
  pathname,
  collapsed,
  onToggle,
}: {
  hub: NavHub;
  pathname: string;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const sectionActive = hubContainsPath(hub, pathname);
  const open = sectionActive || !collapsed;

  return (
    <div className={`stratos-nav-section ${sectionActive ? "stratos-nav-section--active" : ""}`}>
      <div className="stratos-nav-section__head">
        <Link href={hub.defaultHref} className="stratos-nav-section__title" title={hub.label}>
          <NavIcon id={hub.icon} className="stratos-nav-section__icon" />
          {hub.stage ? <span className="stratos-nav-section__stage">{hub.stage}</span> : null}
          <span className="stratos-nav-section__label">{hub.label}</span>
          {hub.id === "posture" ? <InboxNavBadge /> : null}
        </Link>
        <button
          type="button"
          className="stratos-nav-section__toggle"
          aria-expanded={open}
          aria-label={open ? `折叠 ${hub.label}` : `展开 ${hub.label}`}
          onClick={onToggle}
          disabled={sectionActive}
        >
          <span className={`stratos-nav-section__chevron ${open ? "is-open" : ""}`} aria-hidden>
            ›
          </span>
        </button>
      </div>
      {open ? (
        <ul className="stratos-nav-section__list">
          {hub.children.map((child) => {
            const active = matchesNavRoute(pathname, child.href);
            return (
              <li key={child.href}>
                <Link
                  href={child.href}
                  className={`stratos-nav-child ${active ? "stratos-nav-child--active" : ""}`}
                >
                  {child.label}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function LogoutButton() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/login", { method: "DELETE" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      disabled={loggingOut}
      onClick={() => void handleLogout()}
      className="stratos-sidebar__logout"
      title="退出登录"
      aria-label="退出登录"
    >
      <NavLogoutIcon className="stratos-nav-leaf__icon" />
      <span className="stratos-nav-leaf__label">{loggingOut ? "退出中" : "退出"}</span>
    </button>
  );
}

export function AppNav({
  secureMode = false,
  devBypassAuth = false,
}: {
  secureMode?: boolean;
  devBypassAuth?: boolean;
}) {
  const pathname = usePathname();
  const { role } = useRole();
  const home = roleHomePath(role);
  const showAccess = isAdmin(role);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const [mobileOpen, setMobileOpen] = useState(false);
  const [prevPath, setPrevPath] = useState(pathname);
  const asideRef = useRef<HTMLElement | null>(null);
  const hamburgerRef = useRef<HTMLButtonElement | null>(null);

  // Close the mobile drawer on route change (covers programmatic/⌘K navigation).
  // Render-time state adjustment per React docs — avoids cascading effect renders.
  if (pathname !== prevPath) {
    setPrevPath(pathname);
    if (mobileOpen) setMobileOpen(false);
  }

  const hubs = useMemo(
    () => NAV_HUBS.map((h) => filterHubForRole(h, role)).filter(Boolean) as NavHub[],
    [role],
  );
  const standalone = NAV_STANDALONE.filter((item) => filterNavHref(role, item.href));

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  // Drawer a11y: Escape to close, focus into the drawer on open + return focus
  // to the toggle on close, and trap Tab within the drawer while it is open.
  useEffect(() => {
    if (!mobileOpen) return;
    const aside = asideRef.current;
    const hamburger = hamburgerRef.current;
    // Lock background scroll and remove the main content from the interaction +
    // a11y tree while the modal drawer is open (drawer/hamburger are siblings of
    // <main>, so they stay reachable). `inert` covers keyboard + pointer + AT.
    const main = document.querySelector<HTMLElement>(".stratos-shell-main");
    const prevBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (main) {
      main.inert = true;
      main.setAttribute("aria-hidden", "true");
    }
    const focusables = () =>
      Array.from(
        aside?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);

    focusables()[0]?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setMobileOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevBodyOverflow;
      if (main) {
        main.inert = false;
        main.removeAttribute("aria-hidden");
      }
      hamburger?.focus();
    };
  }, [mobileOpen]);

  function toggle(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <>
      <button
        type="button"
        ref={hamburgerRef}
        className="stratos-sidebar__hamburger"
        aria-label={mobileOpen ? "关闭导航" : "打开导航"}
        aria-expanded={mobileOpen}
        aria-controls="stratos-sidebar"
        onClick={() => setMobileOpen((v) => !v)}
      >
        <span className="stratos-sidebar__hamburger-bar" aria-hidden />
        <span className="stratos-sidebar__hamburger-bar" aria-hidden />
        <span className="stratos-sidebar__hamburger-bar" aria-hidden />
      </button>
      {mobileOpen ? (
        <div
          className="stratos-sidebar__backdrop"
          aria-hidden
          onClick={closeMobile}
        />
      ) : null}
      <aside
        ref={asideRef}
        id="stratos-sidebar"
        className={`stratos-sidebar ${mobileOpen ? "stratos-sidebar--open" : ""}`}
        role={mobileOpen ? "dialog" : undefined}
        aria-modal={mobileOpen ? true : undefined}
        aria-label={mobileOpen ? "主导航" : undefined}
      >
        <Link
          href={home}
          className="stratos-sidebar__logo"
          title={`${brand.sidebarLabelZh} · ${brand.rhautt.taglineEn}`}
        >
          <RhauttSidebarLogo />
        </Link>

        <nav
          className="stratos-sidebar__nav"
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("a")) closeMobile();
          }}
        >
        {hubs.map((hub) => (
          <NavSection
            key={hub.id}
            hub={hub}
            pathname={pathname}
            collapsed={collapsed.has(hub.id)}
            onToggle={() => toggle(hub.id)}
          />
        ))}

        {standalone.length > 0 ? <div className="stratos-sidebar__divider" /> : null}

        {standalone.map((item) => (
          <NavLeaf
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={isStandaloneActive(pathname, item.href)}
          />
        ))}

        {showAccess ? (
          <NavLeaf
            href={NAV_ACCESS.href}
            label={NAV_ACCESS.label}
            icon={NAV_ACCESS.icon}
            active={pathname.startsWith(NAV_ACCESS.href)}
          />
        ) : null}
      </nav>

        <div className="stratos-sidebar__foot">
          <RoleSwitcher compact hidden={secureMode && !devBypassAuth} />
          <LogoutButton />
          <kbd className="stratos-sidebar__kbd" title="⌘K 命令面板">
            ⌘K
          </kbd>
        </div>
      </aside>
    </>
  );
}
