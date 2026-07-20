import { NextResponse } from "next/server";
import { requireApiMinLevel } from "@/lib/auth/api-guard";
import { askSwotAi } from "@/lib/market-intel/market-ask-llm";
import { planSwotToBoard, swotBoardItemCount, type PlanSwotInput } from "@/lib/strategy/swot-bridge";

export const runtime = "nodejs";

/** POST { items: PlanSwotInput[] } → 复用市场 SWOT 引擎生成 TOWS(SO/WO/ST/WT)。 */
export async function POST(req: Request) {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;
  try {
    const body = (await req.json()) as { items?: PlanSwotInput[] };
    const items = Array.isArray(body.items) ? body.items : [];
    const board = planSwotToBoard(items);
    if (swotBoardItemCount(board) === 0) {
      return NextResponse.json({ error: "SWOT 盘面为空，请先填写条目" }, { status: 400 });
    }
    const result = await askSwotAi(board);
    return NextResponse.json({ tows: result.tows, engine: result.engine, note: result.note ?? null });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "TOWS 生成失败" }, { status: 500 });
  }
}
