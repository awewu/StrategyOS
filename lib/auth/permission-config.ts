/**
 * Runtime permission configuration.
 *
 * The CEO and CFO can toggle the global "open mode" switch via /admin/access.
 * When open mode is enabled, route checks are relaxed for authenticated users
 * (observer still stays read-only). This is intended for workshops / demos
 * and is off by default.
 */
import type { RoleKey } from "@/lib/constants";

export type PermissionConfig = {
  openMode: boolean;
  adminRoles: RoleKey[];
  executiveRoles: RoleKey[];
};

const DEFAULT_CONFIG: PermissionConfig = {
  openMode: false,
  adminRoles: ["ceo", "cfo"],
  executiveRoles: ["ceo", "cfo", "vp", "system_head"],
};

let runtimeConfig: PermissionConfig | null = null;

export function getPermissionConfig(): PermissionConfig {
  if (runtimeConfig) return runtimeConfig;
  return {
    openMode: process.env.STRATOS_PERMISSION_OPEN_MODE === "1",
    adminRoles: DEFAULT_CONFIG.adminRoles,
    executiveRoles: DEFAULT_CONFIG.executiveRoles,
  };
}

export function setPermissionConfig(config: PermissionConfig): void {
  runtimeConfig = config;
}

export function isAdminRole(role: RoleKey, config = getPermissionConfig()): boolean {
  return config.adminRoles.includes(role);
}

export function isExecutiveRole(role: RoleKey, config = getPermissionConfig()): boolean {
  return config.executiveRoles.includes(role);
}

export function effectiveMinLevel(baseLevel: number, config = getPermissionConfig()): number {
  if (config.openMode && baseLevel > 0) {
    return Math.max(0, baseLevel - 1);
  }
  return baseLevel;
}
