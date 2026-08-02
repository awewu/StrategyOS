/**
 * CEO Gem「帅」审计洞察 API。
 * GET → 以确定性审计(+已留痕的中央 AI 研判)返回按优先级排序的洞察卡。
 * 鉴权: 仅 L3+(ceo/cfo/admin) 可读, 与 /command 路由权限同源。
 */
import { NextResponse } from "next/server";
import { getEffectiveRole } from "@/lib/auth/guard";
import { roleToLevel } from "@/lib/auth/permissions";
import { shouldEnforceRoutePermissions } from "@/lib/auth/resolve-role";
import { buildCeoGemInsights } from "@/lib/gems/ceo-gem";

export const runtime = "nodejs";

export async function GET() {
  const role = await getEffectiveRole();
  if (shouldEnforceRoutePermissions() && roleToLevel(role) < 3) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  try {
    const result = await buildCeoGemInsights();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { error: "gem_audit_failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
