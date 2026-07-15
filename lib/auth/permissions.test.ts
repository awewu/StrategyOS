import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { canAccessRoute, filterNavHref, roleHomePath, isAdmin, isExecutive } from "./permissions";
import { flattenNavLinks } from "@/lib/nav/hubs";

const CEO_MAIN_ROUTES = [
  "/command",
  "/command/issues",
  "/command/compass",
  "/strategy",
  "/strategy/input",
  "/strategy/outlook",
  "/versions",
  "/mandates",
  "/reports",
  "/monitor/health",
  "/monitor/bu",
  "/monitor/functions",
  "/execution",
  "/finance",
  "/decode",
  "/market",
  "/culture",
  "/rehearsal",
  "/gates",
  "/tools/meeting",
  "/print/panorama",
  "/admin/access",
  "/admin/org",
] as const;

describe("permissions · CEO role", () => {
  it("canAccessRoute grants all main nav paths", () => {
    for (const path of CEO_MAIN_ROUTES) {
      assert.equal(canAccessRoute("ceo", path), true, `CEO should access ${path}`);
    }
  });

  it("filterNavHref allows flattened nav links", () => {
    const links = flattenNavLinks();
    assert.ok(links.length > 0);
    for (const link of links) {
      assert.equal(filterNavHref("ceo", link.href), true, `CEO nav: ${link.href}`);
    }
  });

  it("roleHomePath is command deck", () => {
    assert.equal(roleHomePath("ceo"), "/command");
  });
});

describe("permissions · CFO role", () => {
  it("isExecutive and isAdmin", () => {
    assert.equal(isExecutive("cfo"), true);
    assert.equal(isAdmin("cfo"), true);
  });

  it("canAccessRoute grants L3 and admin paths", () => {
    for (const path of ["/finance", "/fpa", "/command", "/admin/access", "/admin/org"]) {
      assert.equal(canAccessRoute("cfo", path), true, `CFO should access ${path}`);
    }
  });

  it("roleHomePath is finance", () => {
    assert.equal(roleHomePath("cfo"), "/finance");
  });
});
