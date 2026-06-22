import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { canAccessRoute, filterNavHref, roleHomePath } from "./permissions";
import { flattenNavLinks } from "@/lib/nav/hubs";

const CEO_MAIN_ROUTES = [
  "/command",
  "/inbox",
  "/compass",
  "/strategy",
  "/strategy/input",
  "/outlook",
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
