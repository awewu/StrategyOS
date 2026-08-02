/**
 * Gems 注册表 — role → 构建器 单一分发点。
 * 覆盖全部 8 个 RoleKey (observer/board/pm/vp/system_head/staff/cfo/ceo)。
 * 注: 'admin' 不是 RoleKey (管理员身份由 isAdmin(role) 派生, ceo/cfo 即管理员),
 *     故不在此表; 系统健康 Gem (buildAdminGem) 供 /admin 场景单独调用。
 */
import type { GemBuildContext, GemInsightResult } from "./types";
import {
  buildBoardGem,
  buildCeoGem,
  buildCfoGem,
  buildObserverGem,
  buildPmGem,
  buildStaffGem,
  buildSystemHeadGem,
  buildVpGem,
} from "./builders";

type GemBuilder = (ctx: GemBuildContext) => Promise<GemInsightResult>;

const REGISTRY: Record<string, GemBuilder> = {
  ceo: buildCeoGem,
  cfo: buildCfoGem,
  board: buildBoardGem,
  observer: buildObserverGem,
  staff: buildStaffGem,
  vp: buildVpGem,
  system_head: buildSystemHeadGem,
  pm: buildPmGem,
};

export function hasGem(role: string): boolean {
  return role in REGISTRY;
}

/** 未注册角色降级到 CEO 全局视界(仅在权限允许时才会到达)。 */
export function buildGemForRole(role: string, ctx: GemBuildContext): Promise<GemInsightResult> {
  const builder = REGISTRY[role] ?? buildCeoGem;
  return builder(ctx);
}
