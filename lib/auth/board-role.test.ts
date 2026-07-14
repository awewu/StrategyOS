import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { canAccessRoute, roleHomePath, roleToLevel } from "./permissions";

describe("board role", () => {
  it("level 0, home is /board", () => {
    assert.equal(roleToLevel("board"), 0);
    assert.equal(roleHomePath("board"), "/board");
  });

  it("can only access board pack + auth/notification endpoints", () => {
    assert.equal(canAccessRoute("board", "/board"), true);
    assert.equal(canAccessRoute("board", "/board/sub"), true);
    assert.equal(canAccessRoute("board", "/login"), true);
    assert.equal(canAccessRoute("board", "/api/board/sign"), true);
    assert.equal(canAccessRoute("board", "/api/notifications"), true);
  });

  it("is blocked from all operational routes, including level-0 ones", () => {
    for (const path of [
      "/strategy",
      "/monitor/health",
      "/culture",
      "/brand",
      "/command",
      "/finance",
      "/inbox",
      "/council",
      "/execution",
      "/admin/access",
    ]) {
      assert.equal(canAccessRoute("board", path), false, `board should NOT access ${path}`);
    }
  });

  it("observer still keeps level-0 access (no regression)", () => {
    assert.equal(canAccessRoute("observer", "/strategy"), true);
    assert.equal(canAccessRoute("observer", "/board"), true);
    assert.equal(canAccessRoute("observer", "/monitor/health"), true);
  });
});
