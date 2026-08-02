/**
 * 战略感知端点 · 供 Tandem 中央 AI 只读消费 (跨仓感知桥, 姿势 B)
 *
 * 中央 AI 通过感知技能 `strategy.validity_digest` 调本端点, 把 StratOS 的
 * "战略合理性传感器" 融进它的五维感知 (OKR/KPI/PMS/市场/战略), 用于
 * 季度合理性复盘的裁决建议 (persevere / pivot / kill)。
 *
 * 纪律:
 *   - 纯只读, 不写任何战略真值 (裁决是建议, 写回走人工/治理 proposeAction)。
 *   - 服务令牌鉴权 (STRATOS_PERCEPTION_TOKEN), 未配置则 503 (诚实告知未启用)。
 *   - 数据边界: 战略数据 = confidential; 由中央 AI 侧 marking/purpose 闸再校验。
 */
import { NextResponse } from "next/server";
import { buildStrategyDigest } from "@/lib/stratos/strategy-digest";

export const runtime = "nodejs";

function unauthorized(msg: string, status: number) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}

/** 服务令牌闸: Authorization: Bearer <STRATOS_PERCEPTION_TOKEN> */
function checkServiceToken(req: Request): NextResponse | null {
  const expected = process.env.STRATOS_PERCEPTION_TOKEN?.trim();
  if (!expected) return unauthorized("perception bridge 未启用 (STRATOS_PERCEPTION_TOKEN 未配置)", 503);
  const header = req.headers.get("authorization") ?? "";
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  if (!token || token !== expected) return unauthorized("Unauthorized", 401);
  return null;
}

export async function GET(req: Request) {
  const denied = checkServiceToken(req);
  if (denied) return denied;

  try {
    const digest = await buildStrategyDigest();
    return NextResponse.json({ ok: true, ...digest });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    console.error("perception-digest error:", error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
