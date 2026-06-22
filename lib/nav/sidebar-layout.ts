/**
 * Sidebar layout — CEO collapses secondary destinations into「更多」.
 * @see docs/UI_VI_EVOLUTION.md §3.2
 *
 * ⚠️ PRODUCT GUARD — DO NOT WIRE INTO AppNav WITHOUT EXPLICIT APPROVAL
 * ---------------------------------------------------------------------
 * This module is intentionally NOT used in production navigation. CEO「更多」
 * collapse hid modules and caused a recurring "modules lost" UX failure.
 * Keep usage limited to unit tests (sidebar-layout.test.ts) until product
 * re-approves collapse behavior with full nav visibility guarantees.
 */

import type { RoleKey } from "@/lib/auth/permissions";
import { filterNavHref } from "@/lib/auth/permissions";
import { NAV_ACCESS, type NavHub, type NavStandalone } from "@/lib/nav/hubs";

export type NavMoreLink = { href: string; label: string };

/** Standalone items always visible on CEO rail (FPA ★) */
export const CEO_RAIL_STANDALONE_IDS = new Set(["finance"]);

export type SidebarNavLayout = {
  primaryHubs: NavHub[];
  railStandalone: NavStandalone[];
  bottomHubs: NavHub[];
  moreLinks: NavMoreLink[];
};

export function layoutSidebarNav(
  role: RoleKey,
  input: {
    primaryHubs: NavHub[];
    standalone: NavStandalone[];
    bottomHubs: NavHub[];
    includeAccess: boolean;
  },
): SidebarNavLayout {
  if (role !== "ceo") {
    return {
      primaryHubs: input.primaryHubs,
      railStandalone: input.standalone,
      bottomHubs: input.bottomHubs,
      moreLinks: [],
    };
  }

  const moreLinks: NavMoreLink[] = [];

  for (const item of input.standalone) {
    if (CEO_RAIL_STANDALONE_IDS.has(item.id)) continue;
    if (filterNavHref(role, item.href)) {
      moreLinks.push({ href: item.href, label: item.label });
    }
  }

  for (const hub of input.bottomHubs) {
    for (const child of hub.children) {
      if (filterNavHref(role, child.href)) {
        moreLinks.push({ href: child.href, label: `${hub.label} · ${child.label}` });
      }
    }
  }

  if (input.includeAccess && filterNavHref(role, NAV_ACCESS.href)) {
    moreLinks.push({ href: NAV_ACCESS.href, label: NAV_ACCESS.label });
  }

  return {
    primaryHubs: input.primaryHubs,
    railStandalone: input.standalone.filter((s) => CEO_RAIL_STANDALONE_IDS.has(s.id)),
    bottomHubs: [],
    moreLinks,
  };
}
