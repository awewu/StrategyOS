import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  canAccessRoute,
  filterNavHref,
  roleHomePath,
  isAdmin,
  isExecutive,
  pageAccessPosture,
} from "./permissions";
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

describe("permissions · staff role", () => {
  it("can access strategy versions and see the nav link", () => {
    assert.equal(canAccessRoute("staff", "/versions"), true);
    assert.equal(filterNavHref("staff", "/versions"), true);
  });
});

describe("permissions · pageAccessPosture (PageGuide tailoring)", () => {
  it("readonly for L0 roles on pages they can view", () => {
    assert.equal(pageAccessPosture("observer", "/strategy"), "readonly");
    assert.equal(pageAccessPosture("observer", "/monitor/bu"), "readonly");
  });

  it("company for executives (ceo/cfo) on full-company pages", () => {
    assert.equal(pageAccessPosture("ceo", "/command"), "company");
    assert.equal(pageAccessPosture("cfo", "/finance"), "company");
    assert.equal(pageAccessPosture("ceo", "/monitor/bu"), "company");
  });

  it("scoped for own-unit action roles (vp/pm/staff)", () => {
    assert.equal(pageAccessPosture("vp", "/monitor/bu"), "scoped");
    assert.equal(pageAccessPosture("vp", "/cockpit"), "scoped");
    assert.equal(pageAccessPosture("pm", "/execution"), "scoped");
    assert.equal(pageAccessPosture("staff", "/versions"), "scoped");
  });

  it("none when the viewer cannot reach the page", () => {
    // VP (L2) cannot reach L3 command deck / finance.
    assert.equal(pageAccessPosture("vp", "/command"), "none");
    assert.equal(pageAccessPosture("pm", "/finance"), "none");
    // board is whitelisted to /board only.
    assert.equal(pageAccessPosture("board", "/command"), "none");
    assert.equal(pageAccessPosture("board", "/board"), "readonly");
  });
});
