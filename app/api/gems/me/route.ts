/**
 * 角色感知 Gem API — 依据当前会话角色返回该角色的审计洞察。
 * 数据作用域(org/project)由 getOrgScope/getProjectScope 派生, 与页面权限同源, 不越权。
 */
import { NextResponse } from "next/server";
import { getEffectiveRole, getEffectiveSession } from "@/lib/auth/guard";
import { getOrgScope, getProjectScope } from "@/lib/auth/scope";
import { buildGemForRole } from "@/lib/gems/registry";
import type { GemBuildContext } from "@/lib/gems/types";

export const runtime = "nodejs";

export async function GET() {
  const role = await getEffectiveRole();
  const session = await getEffectiveSession();

  const ctx: GemBuildContext = {
    role,
    session,
    orgScope: getOrgScope(role, session),
    projectScope: getProjectScope(role, session),
  };

  try {
    const result = await buildGemForRole(role, ctx);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { error: "gem_audit_failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
