import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { PermissionConfig } from "./permission-config";
import {
  effectiveMinLevel,
  getPermissionConfig,
  isAdminRole,
  isExecutiveRole,
  setPermissionConfig,
} from "./permission-config";

const DEFAULT_ADMIN_ROLES = ["ceo", "cfo"] as const;
const DEFAULT_EXEC_ROLES = ["ceo", "cfo", "vp", "system_head"] as const;

describe("permission-config", () => {
  it("defaults to openMode=false and ceo/cfo as admin", () => {
    const config = getPermissionConfig();
    assert.equal(config.openMode, false);
    assert.deepEqual(config.adminRoles, ["ceo", "cfo"]);
    assert.deepEqual(config.executiveRoles, ["ceo", "cfo", "vp", "system_head"]);
  });

  it("setPermissionConfig overrides runtime config", () => {
    setPermissionConfig({ openMode: true, adminRoles: ["ceo", "cfo"], executiveRoles: ["ceo", "cfo"] });
    const config = getPermissionConfig();
    assert.equal(config.openMode, true);
    assert.deepEqual(config.executiveRoles, ["ceo", "cfo"]);
  });

  it("isAdminRole only returns true for configured admin roles", () => {
    const config: PermissionConfig = { openMode: false, adminRoles: [...DEFAULT_ADMIN_ROLES], executiveRoles: [...DEFAULT_EXEC_ROLES] };
    assert.equal(isAdminRole("ceo", config), true);
    assert.equal(isAdminRole("cfo", config), true);
    assert.equal(isAdminRole("vp", config), false);
    assert.equal(isAdminRole("staff", config), false);
  });

  it("isExecutiveRole returns true for configured executive roles", () => {
    const config: PermissionConfig = { openMode: false, adminRoles: [...DEFAULT_ADMIN_ROLES], executiveRoles: [...DEFAULT_EXEC_ROLES] };
    assert.equal(isExecutiveRole("cfo", config), true);
    assert.equal(isExecutiveRole("vp", config), true);
    assert.equal(isExecutiveRole("system_head", config), true);
    assert.equal(isExecutiveRole("pm", config), false);
  });

  it("effectiveMinLevel drops non-admin levels by one in open mode", () => {
    const strict: PermissionConfig = { openMode: false, adminRoles: [...DEFAULT_ADMIN_ROLES], executiveRoles: [...DEFAULT_EXEC_ROLES] };
    const open: PermissionConfig = { openMode: true, adminRoles: [...DEFAULT_ADMIN_ROLES], executiveRoles: [...DEFAULT_EXEC_ROLES] };
    assert.equal(effectiveMinLevel(0, strict), 0);
    assert.equal(effectiveMinLevel(3, strict), 3);
    assert.equal(effectiveMinLevel(0, open), 0);
    assert.equal(effectiveMinLevel(1, open), 0);
    assert.equal(effectiveMinLevel(2, open), 1);
    assert.equal(effectiveMinLevel(3, open), 2);
    assert.equal(effectiveMinLevel(4, open), 3);
  });
});
