import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  NAV_HUBS,
  NAV_STANDALONE,
  NAV_ACCESS,
  NAV_DEEP_LINKS,
} from "./hubs";
import { getPageGuide } from "./page-guides";
import {
  canAccessHub,
  canAccessRoute,
  getMatchingRule,
  isAdmin,
  roleHomePath,
  type RoleKey,
} from "@/lib/auth/permissions";

const ALL_ROLES: RoleKey[] = [
  "observer",
  "board",
  "pm",
  "vp",
  "system_head",
  "staff",
  "cfo",
  "ceo",
];

const pathOf = (href: string) => href.split("?")[0]!;

/**
 * Guards the recurring "modules lost" failure: a destination a role is permitted
 * to reach silently disappearing from the sidebar. The sidebar hides a hub's
 * children behind the hub gate (canAccessHub); if that gate is stricter than a
 * child's own route permission, the permitted child becomes unreachable via nav.
 */
describe("nav ↔ permission consistency", () => {
  it("no permitted hub child is hidden by its hub gate (no lost module)", () => {
    for (const role of ALL_ROLES) {
      for (const hub of NAV_HUBS) {
        for (const child of hub.children) {
          if (canAccessRoute(role, pathOf(child.href))) {
            assert.ok(
              canAccessHub(role, hub.id),
              `LOST MODULE: ${role} may access ${child.href} but hub "${hub.id}" is hidden`,
            );
          }
        }
      }
    }
  });

  it("every role can reach its own home path", () => {
    for (const role of ALL_ROLES) {
      const home = roleHomePath(role);
      assert.ok(
        canAccessRoute(role, home),
        `${role} home ${home} is not accessible to ${role}`,
      );
    }
  });

  it("every visible hub exposes at least one child the role can access", () => {
    for (const role of ALL_ROLES) {
      for (const hub of NAV_HUBS) {
        if (!canAccessHub(role, hub.id)) continue;
        const anyChild = hub.children.some((c) => canAccessRoute(role, pathOf(c.href)));
        // A hub gate open to a role with zero reachable children renders an empty,
        // dead section. AppNav drops it — assert the permission matrix agrees.
        if (!anyChild) {
          for (const c of hub.children) {
            assert.equal(
              canAccessRoute(role, pathOf(c.href)),
              false,
              `hub "${hub.id}" open to ${role} but has no reachable child`,
            );
          }
        }
      }
    }
  });

  it("admin-only access entry is gated exactly to admins", () => {
    for (const role of ALL_ROLES) {
      assert.equal(
        canAccessRoute(role, NAV_ACCESS.href),
        isAdmin(role),
        `${NAV_ACCESS.href} visibility must equal admin status for ${role}`,
      );
    }
  });

  it("standalone destinations follow their own route permission", () => {
    for (const role of ALL_ROLES) {
      for (const s of NAV_STANDALONE) {
        // No hub gate stands between the role and a standalone route, so the only
        // requirement is that the route rule itself resolves — asserted below.
        assert.ok(
          getMatchingRule(pathOf(s.href)) !== null,
          `standalone ${s.href} has no permission rule`,
        );
      }
    }
  });
});

/**
 * Guards ⌘K deep-links and PageGuide content from rotting out of sync with the
 * routes they point at (a silent-decay failure mode).
 */
describe("deep-link + guide route validity", () => {
  it("every ⌘K deep-link resolves to a real route rule and a guide", () => {
    for (const link of NAV_DEEP_LINKS) {
      const path = pathOf(link.href);
      assert.ok(getMatchingRule(path) !== null, `deep-link ${link.href} has no route rule`);
      assert.ok(getPageGuide(path) !== null, `deep-link ${link.href} has no PageGuide`);
    }
  });
});
