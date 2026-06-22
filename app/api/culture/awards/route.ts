import { NextResponse } from "next/server";
import { requireApiMinLevel } from "@/lib/auth/api-guard";
import {
  deleteCultureAward,
  getCultureAwards,
  saveCultureAward,
} from "@/lib/culture/data-access";

export async function GET() {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;
  const { winners, source } = await getCultureAwards();
  return NextResponse.json({ winners, source });
}

export async function POST(req: Request) {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;
  try {
    const body = (await req.json()) as {
      id?: string;
      year?: number;
      period?: string;
      awardName?: string;
      winner?: string;
      unit?: string;
      citation?: string;
    };
    if (!body.winner?.trim() || !body.awardName?.trim()) {
      return NextResponse.json({ error: "奖项名称与获奖人必填" }, { status: 400 });
    }
    const winner = await saveCultureAward({
      id: body.id,
      year: body.year ?? new Date().getFullYear(),
      period: body.period ?? "年度",
      awardName: body.awardName,
      winner: body.winner,
      unit: body.unit ?? "—",
      citation: body.citation ?? "",
    });
    return NextResponse.json({ ok: true, winner });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "保存失败" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const denied = await requireApiMinLevel(2);
  if (denied) return denied;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    await deleteCultureAward(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "删除失败" }, { status: 500 });
  }
}
